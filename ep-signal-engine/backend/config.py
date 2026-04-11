import os
from dotenv import load_dotenv

load_dotenv()

# Supabase — anon key is safe to embed (row-level security enforced on DB)
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://dwmpjtjbijksgbfdgjij.supabase.co",
)
SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bXBqdGpiaWprc2diZmRnamlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODE1MTMsImV4cCI6MjA5MTQ1NzUxM30._dv3M_TX3VyFi_ETgX1_l8-vGt_uJSlqivb0V2m3fC8",
)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
ALERT_EMAIL = os.getenv("ALERT_EMAIL", "lakshaynarasimhan@gmail.com")
