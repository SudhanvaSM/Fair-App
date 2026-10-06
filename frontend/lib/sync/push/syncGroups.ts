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

		const { data: cloudGroup, error: fetchError } = await supabase
			.from("receipts")
			.select("*")
			.eq("id", group.id)
			.maybeSingle();

		if (fetchError) {
			console.error("Failed to fetch cloud receipt: ", group.id, fetchError);
			success = false;
			continue;
		}

		if (!cloudGroup) {
			const { error } = await supabase
				.from('groups')
				.insert({
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

			continue;
		}
		
		const localTime = new Date(group.updated_at).getTime();
		const cloudTime = new Date(cloudGroup.updated_at).getTime();

		if (localTime > cloudTime) {
			const { error } = await supabase
				.from('groups')
				.update({
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
		} else {
			db.runSync(
				`UPDATE groups
				SET name = ?,
					created_at = ?,
					sync_status = ?,
					updated_at = ?,
				WHERE id = ?
				`, [
					cloudGroup.name,
					cloudGroup.created_at,
					"synced",
					cloudGroup.updated_at,
					cloudGroup.id
				]
			);
		}
	}
	return success;
};