import { createClient } from '@supabase/supabase-js';

// Hardcoded for AI Studio compatibility
// (AI Studio preview cannot read import.meta.env variables)
const SUPABASE_URL = 'https://jwwlnjcickeignkemvrj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2xuamNpY2tlaWdua2VtdnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODk1OTAsImV4cCI6MjA4ODg2NTU5MH0.8l6kn6dh_Ki-ecQ78PsL9ma1R5XlhPN6-KmoE9cuYYo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
