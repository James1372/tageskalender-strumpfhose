import { createAdminClient } from '@/lib/supabase/admin'
import { ImagePoolClient } from '@/components/admin/ImagePoolClient'

export default async function BilderPage() {
  const admin = createAdminClient()
  const { data: images } = await admin
    .from('images')
    .select('id, storage_path, status, used_date')
    .order('uploaded_at', { ascending: false })

  const available = (images ?? []).filter(i => i.status === 'available').length
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">Bildpool</h1>
      </div>
      <ImagePoolClient
        images={images ?? []}
        supabaseUrl={supabaseUrl}
        availableCount={available}
      />
    </div>
  )
}
