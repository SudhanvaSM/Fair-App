from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")

if not SUPABASE_PUBLISHABLE_KEY:
	raise RuntimeError("Supabase Publishable Key is missing")

if not SUPABASE_URL:
	raise RuntimeError("Supabase URL is missing")

supabase: Client = create_client(
	SUPABASE_URL,
	SUPABASE_PUBLISHABLE_KEY
)