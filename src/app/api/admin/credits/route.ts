import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { user, admin } = auth

  const { userId, type, value, expiresAt } = await request.json()

  if (!userId || !type || !value) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!['time', 'eur'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (typeof value !== 'number' || value <= 0) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
  }

  const { data, error } = await admin.from('credits').insert({
    user_id: userId,
    type,
    value,
    expires_at: expiresAt ?? null,
    granted_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ credit: data })
}
