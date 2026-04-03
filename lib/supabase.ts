import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmsiyrmqoymvmloveisq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttc2l5cm1xb3ltdm1sb3ZlaXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2ODExNTAsImV4cCI6MjA3MjI1NzE1MH0.YTIsI5LRC_4466Rn5oOBloprkoeAUFBp6ZzqdMowj3I';

// if (!supabaseUrl || !supabaseAnonKey) {
//    throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
