'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Heart, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Post = {
  date: string
  imageUrl: string
  likeCount: number
  commentCount: number
  userLiked: boolean
}

export function PostCard({ post, userId, onOpenModal }: {
  post: Post
  userId: string
  onOpenModal: (date: string) => void
}) {
  const [liked, setLiked] = useState(post.userLiked)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const supabase = createClient()

  async function toggleLike() {
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(c => c + (newLiked ? 1 : -1))
    if (newLiked) {
      await supabase.from('likes').insert({ post_date: post.date, user_id: userId })
    } else {
      await supabase.from('likes').delete()
        .eq('post_date', post.date)
    }
  }

  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden mb-6" id={`post-${post.date}`}>
      <div
        className="relative aspect-[4/3] cursor-zoom-in overflow-hidden"
        onClick={() => onOpenModal(post.date)}
      >
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={`Beitrag vom ${post.date}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-3">
          {format(new Date(post.date), 'd. MMMM yyyy', { locale: de })}
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors
              ${liked ? 'text-gold' : 'text-muted-foreground hover:text-gold'}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-gold' : ''}`} />
            {likeCount}
          </button>
          <button
            onClick={() => onOpenModal(post.date)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            {post.commentCount}
          </button>
        </div>
      </div>
    </article>
  )
}
