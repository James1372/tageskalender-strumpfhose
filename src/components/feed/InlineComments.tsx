'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

type Comment = {
  id: string
  content: string
  created_at: string
  profiles: { email: string } | null
}

export function InlineComments({ date, userId, onCommentAdded }: {
  date: string
  userId: string
  onCommentAdded?: () => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('comments')
      .select('id, content, created_at, profiles(email)')
      .eq('post_date', date)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setComments(((data as Comment[]) ?? []).reverse())
        setLoaded(true)
      })
  }, [date])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setRateLimitError(false)

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_date: date, content: text.trim(), user_id: userId })
      .select('id, content, created_at, profiles(email)')
      .single()

    if (error) {
      if (error.code === '42501') setRateLimitError(true)
    } else if (data) {
      setComments(c => [...c, data as Comment])
      setText('')
      onCommentAdded?.()
    }
    setSubmitting(false)
  }

  const displayName = (email: string | undefined) =>
    email?.split('@')[0] ?? 'Unbekannt'

  return (
    <div className="border-t border-border px-4 pt-3 pb-4 space-y-3">
      {/* Comment list */}
      {loaded && comments.length === 0 && (
        <p className="text-xs text-muted-foreground">Noch keine Kommentare. Sei der Erste!</p>
      )}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className="text-sm">
            <span className="font-medium text-gold mr-2">
              {displayName(c.profiles?.email)}
            </span>
            <span>{c.content}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {formatDistanceToNow(new Date(c.created_at), { locale: de, addSuffix: true })}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      {rateLimitError && (
        <p className="text-xs text-red-400">Limit: max. 5 Kommentare pro Stunde.</p>
      )}
      <form onSubmit={submit} className="flex gap-2 items-center">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Kommentar hinzufügen..."
          maxLength={1000}
          disabled={submitting}
          className="flex-1 bg-transparent border-b border-border text-sm py-1
            focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground/60"
        />
        {text.trim() && (
          <button
            type="submit"
            disabled={submitting}
            className="text-sm font-medium text-gold hover:text-gold/80 transition-colors disabled:opacity-50"
          >
            Posten
          </button>
        )}
      </form>
    </div>
  )
}
