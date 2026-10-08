import { supabase } from "../../supabase";

export default async function fetchItemAssignments() {
	const { data, error } = await supabase
		.from('item_assignments')
		.select(`
			id,
			member_id,
			item_id,
			created_at
		`);

	if (error) {
		throw error;
	}
	return data;
}