import { supabase } from "../../supabase";

export default async function fetchReceipts() {
	const { data, error } = await supabase
		.from('receipts')
		.select(`
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
			receipt_image_uri,
			updated_at
		`);

	if (error) {
		throw error;
	}
	return data;
}