#!/usr/bin/env node
require('dotenv').config();
const { Client } = require('pg');
const url = require('url');

function fail(msg) {
  console.error('ENV CHECK FAILED:', msg);
  process.exitCode = 2;
}

async function checkDatabase(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as ok');
    if (!res || res.rows[0].ok !== 1) throw new Error('unexpected response');
    console.log('✅ DATABASE_URL reachable and responding.');
  } finally {
    await client.end();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const internalKey = process.env.INTERNAL_API_KEY;

  let hadError = false;

  if (!databaseUrl) {
    console.error('Missing `DATABASE_URL` environment variable.');
    hadError = true;
  }

  if (!supabaseUrl) {
    console.error('Missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` environment variable.');
    hadError = true;
  } else {
    try {
      new url.URL(supabaseUrl);
    } catch (err) {
      console.error('`NEXT_PUBLIC_SUPABASE_URL` is not a valid URL.');
      hadError = true;
    }
  }

  if (!serviceKey) {
    console.warn('`SUPABASE_SERVICE_ROLE_KEY` is not set — seeding and admin ops will be skipped.');
  }

  if (!internalKey) {
    console.warn('`INTERNAL_API_KEY` is not set — local API endpoints will require this for protection.');
  }

  if (hadError) {
    fail('One or more required environment variables are missing or invalid.');
    return;
  }

  try {
    await checkDatabase(databaseUrl);
  } catch (err) {
    console.error('Failed to connect to the database at `DATABASE_URL`:', err.message || err);
    process.exitCode = 3;
    return;
  }

  console.log('Environment validation passed.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 99;
});
