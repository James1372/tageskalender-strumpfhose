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

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const results = []

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from('images')
      .upload(path, buffer, { contentType: file.type })

    if (uploadError) {
      results.push({ file: file.name, error: uploadError.message })
      continue
    }

    const { data: img } = await admin
      .from('images')
      .insert({ storage_path: path, uploaded_by: user.id })
      .select('id')
      .single()

    results.push({ file: file.name, id: img?.id, path })
  }

  return NextResponse.json({ results })
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { admin } = auth

  const { imageId } = await request.json()

  const { data: img } = await admin
    .from('images')
    .select('storage_path, status')
    .eq('id', imageId)
    .single()

  if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (img.status === 'used')
    return NextResponse.json({ error: 'Cannot delete used image' }, { status: 400 })

  await admin.storage.from('images').remove([img.storage_path])
  await admin.from('images').delete().eq('id', imageId)

  return NextResponse.json({ success: true })
}
