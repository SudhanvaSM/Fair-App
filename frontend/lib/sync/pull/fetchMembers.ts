import { supabase } from "../../supabase";

export default async function fetchMembers() {
	const { data, error } = await supabase
		.from('members')
		.select(`
			id,
			group_id,
			name,
			active,
			created_at,
			updated_at
		`);

	if (error) {
		throw error;
	}
	return data;
}