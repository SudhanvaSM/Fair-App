import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

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
		const { error } = await supabase
			.from('receipts')
			.delete()
			.eq('id', record.record_id);

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