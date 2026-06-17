import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xukagrjdznqbjaujbpyk.supabase.co';
const supabaseAnonKey = 'sb_publishable_xdA0QOtBlcH9i2s0TqQvlA_esmiKMk4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
