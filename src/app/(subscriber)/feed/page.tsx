import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FeedClient } from '@/components/feed/FeedClient'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const { data: posts } = await supabase
    .from('daily_posts')
    .select('date, images(storage_path)')
    .gte('date', firstOfMonth)
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(10)

  const { data: likes } = await supabase
    .from('likes').select('post_date').eq('user_id', user!.id)

  const admin = createAdminClient()
  const { data: commentCounts } = await admin.rpc('get_comment_counts')

  return (
    <FeedClient
      initialPosts={(posts ?? []) as any}
      userLikes={likes?.map(l => l.post_date) ?? []}
      commentCounts={commentCounts ?? []}
      userId={user!.id}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
    />
  )
}
