import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://erpuxfmftbjmeausqrnd.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycHV4Zm1mdGJqbWVhdXNxcm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODQxODQsImV4cCI6MjA5MTg2MDE4NH0.THcQqf_iwu4KiMZUyAnFHjC19NAwVQX5TFcURme1dUI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
export default supabase;
