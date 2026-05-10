import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FeedClient } from '@/components/feed/FeedClient'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function ArchivePage({
  params,
}: { params: Promise<{ jahr: string; monat: string }> }) {
  const { jahr, monat } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstDay = `${jahr}-${monat}-01`
  // Last day of month: day 0 of next month
  const lastDay = new Date(parseInt(jahr), parseInt(monat), 0)
    .toISOString().split('T')[0]

  const { data: posts } = await supabase
    .from('daily_posts')
    .select('date, images(storage_path)')
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: false })

  const admin = createAdminClient()
  const [
    { data: likesData },
    { data: likeCounts },
    { data: commentCounts },
  ] = await Promise.all([
    admin.rpc('get_user_likes', { user_uuid: user!.id }),
    admin.rpc('get_like_counts'),
    admin.rpc('get_comment_counts'),
  ])

  const monthLabel = format(
    new Date(parseInt(jahr), parseInt(monat) - 1),
    'MMMM yyyy',
    { locale: de }
  )

  return (
    <>
      <h2 className="font-serif text-2xl mb-6">Archiv — {monthLabel}</h2>
      <FeedClient
        initialPosts={(posts ?? []) as any}
        userLikes={(likesData ?? []).map(l => l.post_date)}
        likeCounts={likeCounts ?? []}
        commentCounts={commentCounts ?? []}
        userId={user!.id}
      />
    </>
  )
}
