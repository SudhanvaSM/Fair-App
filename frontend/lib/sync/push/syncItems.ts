import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncItems = async() => {
	const items = db.getAllSync<{
		id: string;
		receipt_id: string;
		name: string;
		qty: number;
		unit_price: number;
		total_price: number;
		created_at: string;
	}> (
		`
			SELECT 
				id,
				receipt_id,
				name,
				qty,
				unit_price, 
				total_price,
				created_at
			FROM items
			WHERE sync_status = 'not_synced';
		`
	)

	let success = true;

	for (const item of items) {
		const { error } = await supabase
			.from('items')
			.insert({
				id: item.id,
				receipt_id: item.receipt_id,
				name: item.name,
				qty: item.qty,
				unit_price: item.unit_price,
				total_price: item.total_price,
				created_at: item.created_at
			});

		if (error) {
			console.error('Failed to sync items: ', item.id, error);
			success = false;
			continue;
		} 

		db.runSync(
			`UPDATE items
			SET sync_status = 'synced'
			WHERE id = ?`,
			[item.id]
		);
	}

	return success;
};