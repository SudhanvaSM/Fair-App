import { supabase } from "../../supabase";

export default async function fetchSettlements() {
	const { data, error } = await supabase
		.from('settlements')
		.select(`
			id,
			group_id,
			from_member_id,
			to_member_id,
			amount,
			created_at
		`);

	if (error) {
		throw error;
	}
	return data;
}