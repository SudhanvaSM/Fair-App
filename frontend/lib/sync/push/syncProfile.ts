import { db } from "@/src/db/database";
import { supabase } from "../../supabase";

export const syncProfiles = async () => {

    const profiles = db.getAllSync<{
        user_id: string;
        email: string;
    }>(`
        SELECT
            user_id,
            email
        FROM profile;
    `);

    let success = true;

    for (const profile of profiles) {

        const { error } = await supabase
            .from("profiles")
            .upsert({
                user_id: profile.user_id,
                email: profile.email
            });

        if (error) {
            console.error(
                "Failed to sync profile:",
                profile.user_id,
                error
            );

            success = false;
            continue;
        }
    }

    return success;
};