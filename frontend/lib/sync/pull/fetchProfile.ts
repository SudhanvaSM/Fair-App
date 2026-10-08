import { supabase } from "../../supabase";

export default async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
        .from("profiles")
        .select(`id, email, created_at`)
        .eq("id", user.id)
        .single();

    if (error) {
        throw error;
    }

    return data;
}