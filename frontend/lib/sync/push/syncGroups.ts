import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncGroups = async() => {
	const groups = db.getAllSync<{
		id: string;
		name: string;
		created_at: string;
		updated_at: string;
	}> (
		`
			SELECT 
				id,
				name,
				created_at,
				updated_at
			FROM groups
			WHERE sync_status = 'not_synced';
		`
	)
	let success = true;
	for (const group of groups) {
		const { error } = await supabase
			.from('groups')
			.upsert({
				id: group.id,
				name: group.name,
				created_at: group.created_at,
				updated_at: group.updated_at
			});

		if (error) {
			console.error('Failed to sync groups: ', group.id, error);
			success = false;
			continue;
		} 

		db.runSync(
			`UPDATE groups
			SET sync_status = 'synced'
			WHERE id = ?`,
			[group.id]
		);
	}
	return success;
};