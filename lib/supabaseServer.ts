import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  // eslint-disable-next-line no-console
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server Supabase client')
}

/**
 * Server-side Supabase client using the service role key.
 * Only use this on server runtime (API routes, server actions). Keep the key secret.
 */
export const supabaseAdmin: SupabaseClient = createClient(url ?? 'http://localhost', serviceRole ?? '', {
  // recommended to disable auto refresh for server usage
  auth: { persistSession: false }
})

export default supabaseAdmin
