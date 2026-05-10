// supabase/functions/daily-cron/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  // Allow only POST requests (from cron scheduler or manual trigger)
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const today = new Date().toISOString().split('T')[0]

  try {
    // Check if today already has a post (idempotent)
    const { data: existing } = await supabase
      .from('daily_posts')
      .select('date')
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Post already exists for today', date: today }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Pick random available image
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id')
      .eq('status', 'available')

    if (imagesError) throw imagesError

    if (!images || images.length === 0) {
      await notifyAdmin('🚨 Bildpool leer! Kein Bild für heute verfügbar.')
      return new Response(
        JSON.stringify({ error: 'No images available', date: today }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const randomImage = images[Math.floor(Math.random() * images.length)]

    // Create daily post
    const { error: postError } = await supabase
      .from('daily_posts')
      .insert({ date: today, image_id: randomImage.id })

    if (postError) throw postError

    // Mark image as used
    const { error: updateError } = await supabase
      .from('images')
      .update({ status: 'used', used_date: today })
      .eq('id', randomImage.id)

    if (updateError) throw updateError

    // Warn if pool is getting low (after using this image)
    const remainingCount = images.length - 1
    if (remainingCount < 14) {
      await notifyAdmin(
        `⚠️ Bildpool fast leer: nur noch ${remainingCount} Bilder verfügbar.`
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        imageId: randomImage.id,
        remainingImages: remainingCount,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await notifyAdmin(`🔥 Cron-Fehler: ${message}`)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function notifyAdmin(message: string): Promise<void> {
  const webhookUrl = Deno.env.get('ADMIN_WEBHOOK_URL')
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `[Bella Bianca] ${message}` }),
    })
  } catch {
    // Don't let notification failure break the cron
  }
}
