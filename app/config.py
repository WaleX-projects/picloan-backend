import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL",'')
NOVA_API_KEY = os.getenv("NOVA_API_KEY", '')
SUPABASE_URL = os.getenv("SUPABASE_URL", '')
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", '')
