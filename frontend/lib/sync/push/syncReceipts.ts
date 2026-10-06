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

		const { data: cloudReceipt, error: fetchError } = await supabase
			.from("receipts")
			.select("*")
			.eq("id", receipt.id)
			.maybeSingle();

		if (fetchError) {
			console.error("Failed to fetch cloud receipt: ", receipt.id, fetchError);
			success = false;
			continue;
		}

		if (!cloudReceipt) {
			const { error } = await supabase
				.from('receipts')
				.insert({
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
				console.error('Failed to insert receipt: ', receipt.id, error);
				success = false;
				continue;
			} 

			db.runSync(
				`UPDATE receipts
				SET sync_status = 'synced'
				WHERE id = ?`,
				[receipt.id]
			);

			continue;
		}

		const localTime = new Date(receipt.updated_at).getTime();
		const cloudTime = new Date(cloudReceipt.updated_at).getTime();

		if (localTime > cloudTime) {
			const { error } = await supabase
				.from('receipts')
				.update({
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
		} else {
			db.runSync(
				`UPDATE receipts
				SET title: ?,
					group_id: ?,
					payer_member_id: ?,
					subtotal: ?,
					tax: ?,
					final_tip: ?,
					service_charge: ?,
					total: ?,
					created_at: ?,
					updated_at: ?,
					sync_status: ?
				WHERE id = ?
				`, [
					cloudReceipt.title,
					cloudReceipt.group_id,
					cloudReceipt.payer_member_id,
					cloudReceipt.subtotal,
					cloudReceipt.tax,
					cloudReceipt.final_tip,
					cloudReceipt.service_charge,
					cloudReceipt.total,
					cloudReceipt.created_at,
					cloudReceipt.updated_at,
					"synced",
					receipt.id
				]
			);
		}
		
	}
	return success;
};