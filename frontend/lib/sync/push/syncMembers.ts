import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncMembers = async() => {
	const { data: { user } } = await supabase.auth.getUser();

	const members = db.getAllSync<{
		id: string;
		group_id: string;
		name: string;
		active: number;
		updated_at: string;
		created_at: string;
	}> (
		`
			SELECT 
				id,
				group_id,
				name,
				active,
				updated_at,
				created_at
			FROM members
			WHERE sync_status = 'not_synced';
		`
	)
	let success = true;

	for (const member of members) {

		const userId = member.name === "You" ? user?.id : null;

		const { data: cloudMember, error: fetchError } = await supabase
			.from("members")
			.select("*")
			.eq("id", member.id)
			.maybeSingle();

		if (fetchError) {
			console.error("Failed to fetch cloud members: ", member.id, fetchError);
			success = false;
			continue;
		}

		if (!cloudMember) {
			const { error } = await supabase
				.from('members')
				.insert({
					id: member.id,
					group_id: member.group_id,
					name: member.name,
					active: member.active,
					updated_at: member.updated_at,
					created_at: member.created_at,
					user_id: userId
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

			continue;
		}
		const localTime = new Date(member.updated_at).getTime();
		const cloudTime = new Date(cloudMember.updated_at).getTime();

		if (localTime > cloudTime) {
			const { error } = await supabase
				.from('members')
				.update({
					id: member.id,
					group_id: member.group_id,
					name: member.name,
					active: member.active,
					updated_at: member.updated_at,
					created_at: member.created_at,
					user_id: userId
				})
				.eq("id", member.id);;

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
		} else {
			db.runSync(
				`UPDATE members
				SET group_id = ?,
					name = ?,
					active = ?,
					sync_status = ?,
					updated_at = ?,
					created_at = ?
				WHERE id = ?
				`, [
					cloudMember.group_id,
					cloudMember.name,
					cloudMember.active,
					"synced",
					cloudMember.updated_at,
					cloudMember.created_at,
					cloudMember.id
				]
			);
		}
	}

	return success;
};