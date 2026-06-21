import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hzgxmamkxwlotyappiwm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6Z3htYW1reHdsb3R5YXBwaXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTkyNzUsImV4cCI6MjA5NzYzNTI3NX0.1nndAX2pTQ48vdcbCIMk8kPidyvaXBnwKqngL9NtWp0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
