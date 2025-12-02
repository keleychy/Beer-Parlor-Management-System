import { NextResponse } from 'next/server'
import supabaseAdmin from '../../../lib/supabaseServer'

const INTERNAL_KEY = process.env.INTERNAL_API_KEY || ''

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from('sales').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const key = req.headers.get('x-internal-key') || ''
  if (!INTERNAL_KEY || key !== INTERNAL_KEY) return unauthorized()

  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('sales').insert([body]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data?.[0] ?? null)
}
