import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnlwbtciagisylsctdmc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tOADxCvpwrO6XvHOJrB7pQ_M_yua_Hi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
