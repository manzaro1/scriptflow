import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
// Environment variables should be set in .env.local file:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://oqhqokbilqmdecutjnfb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHFva2JpbHFtZGVjdXRqbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzI2ODksImV4cCI6MjA4NDY0ODY4OX0.lWre3zMox2siaRGhqkB_EZz0NUqO_RGFc2uvyFrxbAw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
