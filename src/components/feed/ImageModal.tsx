'use client'
import { useEffect, useState, useRef } from 'react'
import { X, ZoomIn, ZoomOut, Heart, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CommentsPanel } from './CommentsPanel'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export function ImageModal({ date, onClose, onNavigate }: {
  date: string
  onClose: () => void
  onNavigate: (date: string) => void
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: post } = await supabase
        .from('daily_posts')
        .select('images(storage_path)')
        .eq('date', date)
        .single()

      if (post?.images) {
        const path = (post.images as { storage_path: string }).storage_path
        setImageUrl(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/uploads/${path}`)
      }

      if (user) {
        const { data: like } = await supabase
          .from('likes')
          .select('user_id')
          .eq('post_date', date)
          .eq('user_id', user.id)
          .maybeSingle()
        setLiked(!!like)
      }

      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_date', date)
      setLikeCount(count ?? 0)
    }
    load()
    // Reset zoom when navigating to a different date
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [date])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (scale > 1) return // In zoom mode, arrows pan instead of navigate
      if (e.key === 'ArrowLeft') {
        const prev = new Date(date)
        prev.setDate(prev.getDate() - 1)
        onNavigate(prev.toISOString().split('T')[0])
      }
      if (e.key === 'ArrowRight') {
        const next = new Date(date)
        next.setDate(next.getDate() + 1)
        onNavigate(next.toISOString().split('T')[0])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [date, onClose, onNavigate, scale])

  // Wheel zoom — must use native addEventListener with passive: false
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setScale(prev => {
        const next = Math.min(5, Math.max(1, prev - e.deltaY * 0.001 * prev))
        if (next === 1) setPan({ x: 0, y: 0 })
        return next
      })
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return
    setPan({
      x: dragStart.current.panX + e.clientX - dragStart.current.x,
      y: dragStart.current.panY + e.clientY - dragStart.current.y,
    })
  }
  function handleMouseUp() { isDragging.current = false }

  async function toggleLike() {
    if (!userId) return
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(c => c + (newLiked ? 1 : -1))
    if (newLiked) {
      await supabase.from('likes').insert({ post_date: date, user_id: userId })
    } else {
      await supabase.from('likes').delete()
        .eq('post_date', date)
        .eq('user_id', userId)
    }
  }

  function navigatePrev() {
    const prev = new Date(date)
    prev.setDate(prev.getDate() - 1)
    onNavigate(prev.toISOString().split('T')[0])
  }
  function navigateNext() {
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    onNavigate(next.toISOString().split('T')[0])
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4
        bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <span className="text-gold text-sm tracking-wider pointer-events-auto">
          {format(new Date(date + 'T12:00:00'), 'd. MMMM yyyy', { locale: de })}
        </span>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => { setScale(s => s > 1 ? 1 : 2); setPan({ x: 0, y: 0 }) }}
            className="p-2 rounded-full bg-black/40 text-white hover:text-gold transition-colors"
            title={scale > 1 ? 'Einpassen (Fit)' : '1:1 Originalgröße'}
          >
            {scale > 1 ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
          <button onClick={onClose}
            className="p-2 rounded-full bg-black/40 text-white hover:text-gold transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative
          ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Navigation arrows — only in standard mode */}
        {scale === 1 && (
          <>
            <button
              onClick={navigatePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3
                bg-black/40 rounded-full text-white hover:text-gold transition-colors text-2xl leading-none">
              ‹
            </button>
            <button
              onClick={navigateNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3
                bg-black/40 rounded-full text-white hover:text-gold transition-colors text-2xl leading-none">
              ›
            </button>
          </>
        )}

        {imageUrl && (
          <>
            {scale === 1 && (
              <img
                src={imageUrl}
                alt={`Beitrag vom ${date}`}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            )}
            {scale > 1 && (
              <img
                src={imageUrl}
                alt={`Beitrag vom ${date}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`,
                  maxWidth: 'none',
                  width: 'auto',
                  height: 'auto',
                }}
                draggable={false}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 transition-colors
              ${liked ? 'text-gold' : 'text-white hover:text-gold'}`}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-gold' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </button>
          <button
            onClick={() => setShowComments(s => !s)}
            className="flex items-center gap-1.5 text-white hover:text-gold transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">Kommentare</span>
          </button>
        </div>
      </div>

      {/* Comments panel */}
      {showComments && (
        <CommentsPanel date={date} onClose={() => setShowComments(false)} />
      )}
    </div>
  )
}
