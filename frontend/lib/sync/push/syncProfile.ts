import { db } from "@/src/db/database";
import { supabase } from "@/lib/supabase";

export const syncProfiles = async () => {

    const profiles = db.getAllSync<{
        user_id: string;
        email: string;
        name: string;
        created_at: string;
    }>(`
        SELECT
            user_id,
            email,
            name,
            created_at
        FROM profile;
    `);

    let success = true;

    for (const profile of profiles) {

        const { error } = await supabase
            .from("profiles")
            .upsert({
                user_id: profile.user_id,
                email: profile.email,
                name: profile.name,
            });

        if (error) {
			if (error.code === "23505") {
				// Already exists remotely — treat as synced
				db.runSync(
					`UPDATE profile
					SET sync_status = 'synced'
					WHERE id = ?`,
					[profile.user_id]
				);

				continue;
			}
			console.error('Failed to sync itemAssignments: ', profile.user_id, error);
			success = false;
			continue;
		}
    }

    return success;
};