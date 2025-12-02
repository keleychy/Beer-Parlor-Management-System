import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Keep this a non-throwing warning so tests and local dev without env still run
  // but developers will see the warning in the console/server logs.
  // In CI/deployments, ensure these env vars are set.
  // eslint-disable-next-line no-console
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase: SupabaseClient = createClient(url ?? 'http://localhost', anonKey ?? 'anon')

/**
 * Example helper: fetch products (client-side)
 * Usage:
 * const { data, error } = await supabase.from('products').select('*')
 */
export async function fetchProducts() {
  return supabase.from('products').select('*')
}

export default supabase
