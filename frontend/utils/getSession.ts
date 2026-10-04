import { supabase } from "@/lib/supabase";

export async function getSession(): Promise<string> {
		const { data: { session } } = await supabase.auth.getSession();

		return (session?.user.id || '0');
	}