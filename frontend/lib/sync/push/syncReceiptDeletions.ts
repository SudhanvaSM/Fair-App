import { db } from "@/src/db/database"
import { supabase } from "lib/supabase";

export const syncReceiptDeletions = async() => {
	const records = db.getAllSync<{
		id: string;
		record_id: string;
	}> (
		`
			SELECT 
				id,
				record_id
			FROM sync_deletions
			WHERE table_name = 'receipts';
		`
	)

	let success = true;

	for (const record of records) {
		// Explicitly remove dependents first. Local ON DELETE CASCADE does not
		// imply that the remote Supabase foreign keys cascade as well.
		const { data: items, error: itemsFetchError } = await supabase
			.from('items').select('id').eq('receipt_id', record.record_id);
		if (itemsFetchError) {
			console.error('Failed to load remote receipt items for deletion:', record.record_id, itemsFetchError);
			success = false;
			continue;
		}
		const itemIds = (items ?? []).map(item => item.id);
		if (itemIds.length > 0) {
			const { error: assignmentsError } = await supabase
				.from('item_assignments').delete().in('item_id', itemIds);
			if (assignmentsError) {
				console.error('Failed to delete remote receipt assignments:', record.record_id, assignmentsError);
				success = false;
				continue;
			}
		}
		const { error: debtsError } = await supabase
			.from('debts').delete().eq('receipt_id', record.record_id);
		if (debtsError) {
			console.error('Failed to delete remote receipt debts:', record.record_id, debtsError);
			success = false;
			continue;
		}
		if (itemIds.length > 0) {
			const { error: itemsError } = await supabase
				.from('items').delete().in('id', itemIds);
			if (itemsError) {
				console.error('Failed to delete remote receipt items:', record.record_id, itemsError);
				success = false;
				continue;
			}
		}
		const { error } = await supabase.from('receipts').delete().eq('id', record.record_id);

		if (error) {
			console.error('Failed to sync receipt deletion: ', record.record_id, error);
			success = false;
			continue;
		} 

		db.runSync(
			`DELETE FROM sync_deletions
			WHERE id = ?`,
			[record.id]
		);
	}

	return success;
};
