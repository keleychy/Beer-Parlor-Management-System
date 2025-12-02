#!/usr/bin/env node
/**
 * Seed script that uses the Supabase service role key to create auth users
 * and populate `products` and other tables. Requires environment variables:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js
 */

const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(url, serviceKey)

async function createAuthUser(email, password, role, name) {
  // Create user in Auth
  const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { role, name }
  })
  if (userErr) throw userErr
  const userId = userData.user.id

  // Insert profile row in public.users
  const { error: insertErr } = await supabaseAdmin.from('users').insert([{ id: userId, email, name, role }])
  if (insertErr) throw insertErr
  return userId
}

async function seed() {
  try {
    console.log('Seeding users...')
    const adminId = await createAuthUser('admin@distinguishbarsgrills.com', 'admin123', 'admin', 'Admin User')
    const storeId = await createAuthUser('storekeeper@distinguishbarsgrills.com', 'store123', 'storekeeper', 'Store Keeper')
    await createAuthUser('attendant@distinguishbarsgrills.com', 'attend123', 'attendant', 'Attendant')
    await createAuthUser('attendant2@distinguishbarsgrills.com', 'attend123', 'attendant', 'Attendant 2')
    await createAuthUser('attendant3@distinguishbarsgrills.com', 'attend123', 'attendant', 'Attendant 3')

    console.log('Seeding products...')
    const products = [
      { name: 'Heineken', category: 'Beer', quantity: 300, reorder_level: 24, unit_price: 1200, quantity_per_crate: 12 },
      { name: 'Heineken (small)', category: 'Beer', quantity: 1200, reorder_level: 24, unit_price: 1000, quantity_per_crate: 24 },
      { name: 'Life', category: 'Beer', quantity: 300, reorder_level: 24, unit_price: 1000, quantity_per_crate: 12 },
      { name: 'Tiger', category: 'Beer', quantity: 240, reorder_level: 24, unit_price: 1000, quantity_per_crate: 24 },
      { name: 'Guinness (medium stout)', category: 'Beer', quantity: 80, reorder_level: 30, unit_price: 1000, quantity_per_crate: 12 },
      { name: 'Pepsi', category: 'Soft Drink', quantity: 200, reorder_level: 60, unit_price: 500, quantity_per_crate: 24 }
    ]

    const { error: prodErr } = await supabaseAdmin.from('products').insert(products)
    if (prodErr) throw prodErr

    console.log('Seed completed successfully')
  } catch (err) {
    console.error('Seed failed', err.message || err)
    process.exit(1)
  }
}

seed()
