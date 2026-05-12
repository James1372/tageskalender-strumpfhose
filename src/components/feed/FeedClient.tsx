'use client'
import { useState, useCallback } from 'react'
import { PostCard } from './PostCard'
import { ImageModal } from './ImageModal'
import { createClient } from '@/lib/supabase/client'

type RawPost = { date: string; images: { storage_path: string } | null }

export function FeedClient({ initialPosts, userLikes, likeCounts, commentCounts, userId }: {
  initialPosts: RawPost[]
  userLikes: string[]
  likeCounts: { post_date: string; count: number }[]
  commentCounts: { post_date: string; count: number }[]
  userId: string
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [hasMore, setHasMore] = useState(true)
  const [modalDate, setModalDate] = useState<string | null>(null)
  const supabase = createClient()

  const loadMore = useCallback(async () => {
    const oldest = posts[posts.length - 1]?.date
    if (!oldest) return
    const { data } = await supabase
      .from('daily_posts')
      .select('date, images(storage_path)')
      .lt('date', oldest)
      .order('date', { ascending: false })
      .limit(10)
    if (!data || data.length === 0) { setHasMore(false); return }
    setPosts(p => [...p, ...(data as RawPost[])])
  }, [posts, supabase])

  const observerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) loadMore()
    }, { threshold: 0.1 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore, hasMore])

  const commentCountMap = Object.fromEntries(commentCounts.map(c => [c.post_date, Number(c.count)]))
  const likeCountMap = Object.fromEntries(likeCounts.map(c => [c.post_date, Number(c.count)]))

  function getImageUrl(storagePath: string) {
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/uploads/${storagePath}`
  }

  return (
    <>
      {posts.map(post => (
        <PostCard
          key={post.date}
          userId={userId}
          post={{
            date: post.date,
            imageUrl: post.images ? getImageUrl(post.images.storage_path) : '',
            likeCount: likeCountMap[post.date] ?? 0,
            commentCount: commentCountMap[post.date] ?? 0,
            userLiked: userLikes.includes(post.date),
          }}
          onOpenModal={setModalDate}
        />
      ))}
      {hasMore && <div ref={observerRef} className="h-8" />}
      {modalDate && (
        <ImageModal
          date={modalDate}
          onClose={() => setModalDate(null)}
          onNavigate={setModalDate}
        />
      )}
    </>
  )
}
