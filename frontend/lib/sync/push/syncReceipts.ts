import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncReceipts = async() => {
	const receipts = db.getAllSync<{
		id: string;
		title: string;
		group_id: string;
		payer_member_id: string;
		subtotal: number;
		tax: number;
		final_tip: number;
		service_charge: number;
		total: number;
		created_at: string;
		updated_at: string;
	}> (
		`
			SELECT 
				id,
				title,
				group_id,
				payer_member_id,
				subtotal,
				tax,
				final_tip,
				service_charge,
				total,
				created_at,
				updated_at
			FROM receipts
			WHERE sync_status = 'not_synced';
		`
	)

	let success = true;

	for (const receipt of receipts) {
		const { error } = await supabase
			.from('receipts')
			.upsert({
				id: receipt.id,
				title: receipt.title,
				group_id: receipt.group_id,
				payer_member_id: receipt.payer_member_id,
				subtotal: receipt.subtotal,
				tax: receipt.tax,
				final_tip: receipt.final_tip,
				service_charge: receipt.service_charge,
				total: receipt.total,
				created_at: receipt.created_at,
				updated_at: receipt.updated_at
			});

		if (error) {
			console.error('Failed to sync receipts: ', receipt.id, error);
			success = false;
			continue;
		} 

		db.runSync(
			`UPDATE receipts
			SET sync_status = 'synced'
			WHERE id = ?`,
			[receipt.id]
		);
	}
	return success;
};