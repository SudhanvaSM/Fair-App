import { db } from "@/src/db/database"
import { supabase } from "../../supabase";

export const syncGroupDeletions = async() => {
	const records = db.getAllSync<{
		id: string;
		record_id: string;
	}> (
		`
			SELECT 
				id,
				record_id
			FROM sync_deletions
			WHERE table_name = 'groups';
		`
	)

	let success = true;

	for (const record of records) {
		const { error } = await supabase
			.from('groups')
			.delete()
			.eq('id', record.record_id);

		if (error) {
			console.error('Failed to sync group deletion: ', record.record_id, error);
			success = false;
			continue;
		} 

		db.runSync(
			`DELETE FROM sync_deletions
			WHERE id = ?`,
			[record.id]
		);
	}

	return success;
};