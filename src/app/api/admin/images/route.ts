import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import sharp from 'sharp'
import { thumbPath } from '@/lib/thumb'

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

const uploadsDir = join(process.cwd(), 'public', 'uploads')

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { user, admin } = auth

  await mkdir(uploadsDir, { recursive: true })

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const results = []

  for (const file of files) {
    const ext = extname(file.name).toLowerCase() || '.jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const filepath = join(uploadsDir, filename)

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filepath, buffer)

      const thumbFilename = thumbPath(filename)
      const thumbFilepath = join(uploadsDir, thumbFilename)
      try {
        await sharp(buffer).resize(600).jpeg({ quality: 80 }).toFile(thumbFilepath)
      } catch (thumbErr) {
        console.error(`Thumbnail generation failed for ${filename}:`, thumbErr)
      }

      const { data: img, error: dbErr } = await admin
        .from('images')
        .insert({ storage_path: filename, uploaded_by: user.id })
        .select('id')
        .single()

      if (dbErr) {
        await unlink(filepath).catch(() => {})
        await unlink(thumbFilepath).catch(() => {})
        results.push({ file: file.name, error: dbErr.message })
        continue
      }

      results.push({ file: file.name, id: img?.id, path: filename })
    } catch (err) {
      results.push({ file: file.name, error: String(err) })
    }
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

  try {
    await unlink(join(uploadsDir, img.storage_path))
  } catch {
    // File may already be gone — continue with DB cleanup
  }

  try {
    await unlink(join(uploadsDir, thumbPath(img.storage_path)))
  } catch {
    // Thumb may not exist — continue
  }

  await admin.from('images').delete().eq('id', imageId)
  return NextResponse.json({ success: true })
}
