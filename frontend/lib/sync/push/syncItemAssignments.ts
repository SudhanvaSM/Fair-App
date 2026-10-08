import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncItemAssignments = async() => {
	const itemAssignments = db.getAllSync<{
		id: string;
		member_id: string;
		item_id: string;
		created_at: string;
	}> (
		`
			SELECT 
				id,
				member_id,
				item_id,
				created_at
			FROM item_assignments
			WHERE sync_status = 'not_synced';
		`
	)

	let success = true;

	for (const itemAssignment of itemAssignments) {
		const { error } = await supabase
			.from('item_assignments')
			.insert({
				id: itemAssignment.id,
				member_id: itemAssignment.member_id,
				item_id: itemAssignment.item_id,
				created_at: itemAssignment.created_at
			});

		if (error) {
			console.error('Failed to sync itemAssignments: ', itemAssignment.id, error);
			success = false;
			continue;
		} 

		db.runSync(
			`UPDATE item_assignments
			SET sync_status = 'synced'
			WHERE id = ?`,
			[itemAssignment.id]
		);
	}

	return success;
};