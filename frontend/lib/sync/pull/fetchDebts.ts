import { supabase } from "../../supabase";

export default async function fetchDebts() {
	const { data, error } = await supabase
		.from('debts')
		.select(`
			id,
			receipt_id,
			group_id,
			from_member_id,
			to_member_id,
			amount,
			status,
			updated_at
		`);

	if (error) {
		throw error;
	}
	return data;
}