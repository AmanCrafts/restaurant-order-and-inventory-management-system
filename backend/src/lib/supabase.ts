import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for public/anonymous operations (used in frontend or public API routes)
export const supabaseClient: SupabaseClient = (() => {
  if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
    console.warn(
      '⚠️  SUPABASE_URL is not set. Supabase client will not work properly.',
    );
    return null as unknown as SupabaseClient;
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
    console.warn(
      '⚠️  SUPABASE_ANON_KEY is not set. Supabase client will not work properly.',
    );
    return null as unknown as SupabaseClient;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
})();

// Admin client for server-side operations (has elevated privileges)
// WARNING: Keep this secure - never expose to client-side
export const supabaseAdmin: SupabaseClient = (() => {
  if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
    console.warn(
      '⚠️  SUPABASE_URL is not set. Supabase admin client will not work properly.',
    );
    return null as unknown as SupabaseClient;
  }
  if (
    !supabaseServiceRoleKey ||
    supabaseServiceRoleKey === 'your_supabase_service_role_key'
  ) {
    console.warn(
      '⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Supabase admin operations will not work.',
    );
    return null as unknown as SupabaseClient;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
})();

export default supabaseClient;
