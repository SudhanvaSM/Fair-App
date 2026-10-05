import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncMembers = async() => {
	const members = db.getAllSync<{
		id: string;
		group_id: string;
		name: string;
		active: number;
		updated_at: string;
	}> (
		`
			SELECT 
				id,
				group_id,
				name,
				active,
				updated_at
			FROM members
			WHERE sync_status = 'not_synced';
		`
	)

	let success = true;

	for (const member of members) {
		const { error } = await supabase
			.from('members')
			.upsert({
				id: member.id,
				group_id: member.group_id,
				name: member.name,
				active: member.active,
				updated_at: member.updated_at
			});

		if (error) {
			console.error('Failed to sync members: ', member.id, error);
			success = false;
			continue;
		} 

		db.runSync(
			`UPDATE members
			SET sync_status = 'synced'
			WHERE id = ?`,
			[member.id]
		);
	}

	return success;
};