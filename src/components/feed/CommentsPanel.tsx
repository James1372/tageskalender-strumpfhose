'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

type Comment = {
  id: string
  content: string
  created_at: string
  profiles: { email: string } | null
}

export function CommentsPanel({ date, onClose }: { date: string; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
    supabase
      .from('comments')
      .select('id, content, created_at, profiles(email)')
      .eq('post_date', date)
      .order('created_at')
      .then(({ data }) => setComments((data as Comment[]) ?? []))
  }, [date])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId) return
    setSubmitting(true)
    setRateLimitError(false)

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_date: date, content: text.trim(), user_id: userId })
      .select('id, content, created_at, profiles(email)')
      .single()

    if (error) {
      // RLS rate-limit violation
      if (error.code === '42501') setRateLimitError(true)
    } else if (data) {
      setComments(c => [...c, data as Comment])
      setText('')
    }
    setSubmitting(false)
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border
      flex flex-col z-20">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-medium text-sm">Kommentare</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center pt-4">
            Noch keine Kommentare.
          </p>
        )}
        {comments.map(c => (
          <div key={c.id}>
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span className="text-xs text-gold truncate">
                {c.profiles?.email?.split('@')[0] ?? 'Unbekannt'}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(c.created_at), { locale: de, addSuffix: true })}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{c.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="p-4 border-t border-border space-y-2">
        {rateLimitError && (
          <p className="text-xs text-red-400">Limit erreicht: max. 5 Kommentare pro Stunde.</p>
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Kommentar schreiben..."
            maxLength={1000}
            disabled={submitting}
            className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-sm
              focus:outline-none focus:border-gold transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="px-3 py-1.5 bg-gold text-black rounded text-sm font-medium
              disabled:opacity-50 hover:bg-gold/90 transition-colors"
          >
            ↑
          </button>
        </div>
      </form>
    </div>
  )
}
