from database import supabase

response = supabase.table("groups").select("*").execute()

print(response.data)