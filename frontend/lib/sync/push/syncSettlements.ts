import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncSettlements = async() => {
	const settlements = db.getAllSync<{
		id: string;
		group_id: string;
		from_member_id: string;
		to_member_id: string;
		amount: number;
		created_at: string;
	}> (
		`
			SELECT 
				id,
				group_id,
				from_member_id,
				to_member_id,
				amount,
				created_at
			FROM settlements
			WHERE sync_status = 'not_synced';
		`
	)

	let success = true;

	for (const settlement of settlements) {
		const { error } = await supabase
			.from('settlements')
			.insert({
				id: settlement.id,
				group_id: settlement.group_id,
				from_member_id: settlement.from_member_id,
				to_member_id: settlement.to_member_id,
				amount: settlement.amount,
				created_at: settlement.created_at
			});

		if (error) {
			if (error.code === "23505") {
				// Already exists remotely — treat as synced
				db.runSync(
					`UPDATE settlements
					SET sync_status = 'synced'
					WHERE id = ?`,
					[settlement.id]
				);

				continue;
			}
			console.error('Failed to sync itemAssignments: ', settlement.id, error);
			success = false;
			continue;
		}
	}

	return success;
};