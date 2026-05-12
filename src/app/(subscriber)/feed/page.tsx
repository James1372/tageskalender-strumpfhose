import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FeedClient } from '@/components/feed/FeedClient'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vienna' })
  const [y, m] = today.split('-')
  const firstOfMonth = `${y}-${m}-01`

  const { data: posts } = await supabase
    .from('daily_posts')
    .select('date, images(storage_path)')
    .gte('date', firstOfMonth)
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(10)

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

  return (
    <FeedClient
      initialPosts={(posts ?? []) as any}
      userLikes={(likesData ?? []).map(l => l.post_date)}
      likeCounts={likeCounts ?? []}
      commentCounts={commentCounts ?? []}
      userId={user!.id}
    />
  )
}
