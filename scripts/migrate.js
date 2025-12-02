#!/usr/bin/env node
/*
  Simple migration runner: runs SQL files in `supabase/migrations` in lexicographic order
  Requires `DATABASE_URL` environment variable (Postgres connection string).

  Usage:
    DATABASE_URL="postgres://..." node scripts/migrate.js
    npm run migrate (after setting DATABASE_URL in env or .env.local)

  WARNING: Running migrations will modify the target database. Test in staging first.
*/

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Missing DATABASE_URL environment variable. Set it to your Supabase Postgres connection string.')
    process.exit(1)
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  if (files.length === 0) {
    console.log('No migrations found in', migrationsDir)
    process.exit(0)
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      console.log('Applying', file)
      const sql = fs.readFileSync(filePath, 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('COMMIT')
        console.log('Applied', file)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error('Error applying', file, err.message || err)
        throw err
      }
    }
    console.log('All migrations applied successfully')
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
