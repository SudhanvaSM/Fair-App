import { supabase } from "lib/supabase";

export async function getSession(): Promise<string> {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) {
			console.log("No user session");
			return "0";
		}

		return (session?.user.id || '0');
	}