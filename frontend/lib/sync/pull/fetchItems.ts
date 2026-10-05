import { supabase } from "../../supabase";

export default async function fetchItems() {
	const { data, error } = await supabase
		.from('items')
		.select(`
			id,
			receipt_id,
			name,
			qty,
			unit_price,
			total_price,
			updated_at
		`);

	if (error) {
		throw error;
	}
	return data;
}