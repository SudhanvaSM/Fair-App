import { supabase } from "../../supabase";

export default async function fetchGroups() {
	const { data, error } = await supabase
		.from('groups')
		.select(`
			id,
			name,
			created_at,
			updated_at
		`);

	if (error) {
		throw error;
	}
	return data;
}