import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncDebts = async() => {
	const debts = db.getAllSync<{
		id: string;
		receipt_id: string;
		group_id: string;
		from_member_id: string;
		to_member_id: string;
		amount: number;
		status: string;
		updated_at: string;
	}> (
		`
			SELECT 
				id,
				receipt_id,
				group_id,
				from_member_id,
				to_member_id,
				amount, 
				status,
				updated_at
			FROM debts
			WHERE sync_status = 'not_synced';
		`
	)

	let success = true;

	for (const debt of debts) {
		const { error } = await supabase
			.from('debts')
			.upsert({
				id: debt.id,
				receipt_id: debt.receipt_id,
				group_id: debt.group_id,
				from_member_id: debt.from_member_id,
				to_member_id: debt.to_member_id,
				amount: debt.amount,
				status: debt.status,
				updated_at: debt.updated_at
			});

		if (error) {
			console.error('Failed to sync debts: ', debt.id, error);
			success = false;
			continue;
		} 

		db.runSync(
			`UPDATE debts
			SET sync_status = 'synced'
			WHERE id = ?`,
			[debt.id]
		);
	}

	return success;
};