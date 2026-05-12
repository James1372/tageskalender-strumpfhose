import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vienna' })

  try {
    // Idempotency check
    const { data: existing } = await admin
      .from('daily_posts').select('date').eq('date', today).maybeSingle()

    if (existing) {
      return NextResponse.json({ message: 'Post already exists for today', date: today })
    }

    // Pick random available image
    const { data: images, error: imagesError } = await admin
      .from('images').select('id').eq('status', 'available')

    if (imagesError) throw imagesError

    if (!images || images.length === 0) {
      await notifyAdmin('🚨 Bildpool leer! Kein Bild für heute verfügbar.')
      return NextResponse.json({ error: 'No images available', date: today }, { status: 500 })
    }

    const randomImage = images[Math.floor(Math.random() * images.length)]

    const { error: postError } = await admin
      .from('daily_posts').insert({ date: today, image_id: randomImage.id })
    if (postError) throw postError

    const { error: updateError } = await admin
      .from('images').update({ status: 'used', used_date: today }).eq('id', randomImage.id)
    if (updateError) throw updateError

    const remaining = images.length - 1
    if (remaining < 14) {
      await notifyAdmin(`⚠️ Bildpool fast leer: nur noch ${remaining} Bilder verfügbar.`)
    }

    return NextResponse.json({ success: true, date: today, imageId: randomImage.id, remaining })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await notifyAdmin(`🔥 Cron-Fehler: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function notifyAdmin(message: string) {
  const webhookUrl = process.env.ADMIN_WEBHOOK_URL
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `[Bella Bianca] ${message}` }),
    })
  } catch {
    // Never let notification failure affect the response
  }
}
