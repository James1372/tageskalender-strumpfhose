# Thumbnails & Natürliches Seitenverhältnis — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bilder im Feed im natürlichen Seitenverhältnis anzeigen und überall verkleinerte Thumbnails (600px) laden statt voller Originale; Modal lädt weiterhin das Original.

**Architecture:** Beim Upload erzeugt `sharp` sofort eine `-thumb.jpg`-Variante neben dem Original. Eine zentrale `thumbPath()`-Hilfsfunktion leitet den Thumb-Pfad aus dem Original-Pfad ab. Feed und Admin-Grid verwenden Thumbs; ein einmaliges Migrationsskript erstellt Thumbs für bestehende Bilder.

**Tech Stack:** Next.js 16, sharp (neu), Jest, TypeScript

---

## Dateiübersicht

| Aktion | Datei | Zweck |
|--------|-------|-------|
| Neu | `src/lib/thumb.ts` | `thumbPath()` Hilfsfunktion |
| Neu | `src/__tests__/thumb.test.ts` | Unit-Tests für thumbPath |
| Neu | `scripts/generate-thumbnails.ts` | Einmaliges Migrationsskript |
| Ändern | `src/app/api/admin/images/route.ts` | Thumbnail beim Upload generieren |
| Ändern | `src/components/feed/FeedClient.tsx` | `thumbnailUrl` an PostCard übergeben |
| Ändern | `src/components/feed/PostCard.tsx` | Natürliches Seitenverhältnis + Thumbnail |
| Ändern | `src/components/admin/ImagePoolClient.tsx` | Thumbnails im Admin-Grid |
| Ändern | `src/__tests__/build.test.ts` | thumb.ts in Struktur-Check aufnehmen |

---

## Task 1: thumbPath-Hilfsfunktion

**Files:**
- Create: `src/lib/thumb.ts`
- Create: `src/__tests__/thumb.test.ts`
- Modify: `src/__tests__/build.test.ts`

- [ ] **Schritt 1: Failing test schreiben**

`src/__tests__/thumb.test.ts`:
```ts
import { thumbPath } from '@/lib/thumb'

describe('thumbPath', () => {
  it('replaces jpg extension', () => {
    expect(thumbPath('1234-abc.jpg')).toBe('1234-abc-thumb.jpg')
  })

  it('replaces png extension with jpg', () => {
    expect(thumbPath('1234-abc.png')).toBe('1234-abc-thumb.jpg')
  })

  it('replaces webp extension with jpg', () => {
    expect(thumbPath('photo.webp')).toBe('photo-thumb.jpg')
  })

  it('handles dots in filename', () => {
    expect(thumbPath('my.photo.2024.jpg')).toBe('my.photo.2024-thumb.jpg')
  })
})
```

- [ ] **Schritt 2: Test ausführen — muss fehlschlagen**

```bash
npm test -- --testPathPattern=thumb
```

Erwartet: `Cannot find module '@/lib/thumb'`

- [ ] **Schritt 3: Implementation schreiben**

`src/lib/thumb.ts`:
```ts
export function thumbPath(storagePath: string): string {
  return storagePath.replace(/\.[^.]+$/, '-thumb.jpg')
}
```

- [ ] **Schritt 4: Test erneut ausführen — muss bestehen**

```bash
npm test -- --testPathPattern=thumb
```

Erwartet: `4 passed`

- [ ] **Schritt 5: build.test.ts erweitern**

In `src/__tests__/build.test.ts` in den Block `it('has required source files', ...)` folgende Zeile ergänzen:

```ts
expect(existsSync(join(root, 'src/lib/thumb.ts'))).toBe(true)
```

- [ ] **Schritt 6: Alle Tests ausführen**

```bash
npm test
```

Erwartet: alle bestehen

- [ ] **Schritt 7: Commit**

```bash
git add src/lib/thumb.ts src/__tests__/thumb.test.ts src/__tests__/build.test.ts
git commit -m "feat: add thumbPath helper for thumbnail filename derivation"
```

---

## Task 2: sharp installieren + Thumbnail beim Upload generieren

**Files:**
- Modify: `src/app/api/admin/images/route.ts`

- [ ] **Schritt 1: sharp installieren**

```bash
npm install sharp
```

Erwartet: `package.json` enthält jetzt `"sharp"` unter dependencies.

- [ ] **Schritt 2: Upload-Route anpassen**

`src/app/api/admin/images/route.ts` vollständig ersetzen:

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import sharp from 'sharp'
import { thumbPath } from '@/lib/thumb'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

const uploadsDir = join(process.cwd(), 'public', 'uploads')

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { user, admin } = auth

  await mkdir(uploadsDir, { recursive: true })

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const results = []

  for (const file of files) {
    const ext = extname(file.name).toLowerCase() || '.jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const filepath = join(uploadsDir, filename)

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filepath, buffer)

      const thumbFilename = thumbPath(filename)
      const thumbFilepath = join(uploadsDir, thumbFilename)
      try {
        await sharp(buffer).resize(600).jpeg({ quality: 80 }).toFile(thumbFilepath)
      } catch (thumbErr) {
        console.error(`Thumbnail generation failed for ${filename}:`, thumbErr)
      }

      const { data: img } = await admin
        .from('images')
        .insert({ storage_path: filename, uploaded_by: user.id })
        .select('id')
        .single()

      results.push({ file: file.name, id: img?.id, path: filename })
    } catch (err) {
      results.push({ file: file.name, error: String(err) })
    }
  }

  return NextResponse.json({ results })
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { admin } = auth

  const { imageId } = await request.json()

  const { data: img } = await admin
    .from('images')
    .select('storage_path, status')
    .eq('id', imageId)
    .single()

  if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (img.status === 'used')
    return NextResponse.json({ error: 'Cannot delete used image' }, { status: 400 })

  try {
    await unlink(join(uploadsDir, img.storage_path))
  } catch {
    // File may already be gone — continue with DB cleanup
  }

  try {
    await unlink(join(uploadsDir, thumbPath(img.storage_path)))
  } catch {
    // Thumb may not exist — continue
  }

  await admin.from('images').delete().eq('id', imageId)
  return NextResponse.json({ success: true })
}
```

Hinweis: DELETE löscht jetzt auch den Thumbnail mit (try/catch, falls kein Thumb vorhanden).

- [ ] **Schritt 3: Manuell testen**

Dev-Server starten (`npm run dev`), im Admin-Bereich ein Bild hochladen, dann prüfen:

```bash
ls public/uploads/ | grep thumb
```

Erwartet: Eine Datei `*-thumb.jpg` erscheint neben dem Original.

- [ ] **Schritt 4: Commit**

```bash
git add src/app/api/admin/images/route.ts package.json package-lock.json
git commit -m "feat: generate 600px thumbnail on image upload"
```

---

## Task 3: Migrationsskript für bestehende Bilder

**Files:**
- Create: `scripts/generate-thumbnails.ts`

- [ ] **Schritt 1: Skript erstellen**

`scripts/generate-thumbnails.ts`:
```ts
import { readdir, access } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { thumbPath } from '../src/lib/thumb'

const uploadsDir = join(process.cwd(), 'public', 'uploads')

async function run() {
  const files = await readdir(uploadsDir)
  const originals = files.filter(
    f => !f.endsWith('-thumb.jpg') && /\.(jpe?g|png|webp|gif)$/i.test(f)
  )

  console.log(`Found ${originals.length} original images`)
  let generated = 0
  let skipped = 0
  let errors = 0

  for (const file of originals) {
    const thumbName = thumbPath(file)
    const thumbFilepath = join(uploadsDir, thumbName)

    try {
      await access(thumbFilepath)
      skipped++
      continue
    } catch {
      // thumb doesn't exist, generate it
    }

    try {
      await sharp(join(uploadsDir, file))
        .resize(600)
        .jpeg({ quality: 80 })
        .toFile(thumbFilepath)
      console.log(`✓ ${file} → ${thumbName}`)
      generated++
    } catch (err) {
      console.error(`✗ ${file}: ${err}`)
      errors++
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${errors} errors`)
}

run().catch(console.error)
```

- [ ] **Schritt 2: Skript ausführen**

```bash
npx tsx scripts/generate-thumbnails.ts
```

Erwartet: Ausgabe zeigt Anzahl generierter Thumbs. Fehler werden geloggt aber das Skript läuft weiter.

- [ ] **Schritt 3: Ergebnis prüfen**

```bash
ls public/uploads/ | grep thumb | wc -l
ls public/uploads/ | grep -v thumb | grep -E '\.(jpg|jpeg|png|webp)$' | wc -l
```

Beide Zahlen sollten gleich sein.

- [ ] **Schritt 4: Commit**

```bash
git add scripts/generate-thumbnails.ts
git commit -m "feat: add migration script to generate thumbnails for existing images"
```

---

## Task 4: Feed — natürliches Seitenverhältnis + Thumbnails

**Files:**
- Modify: `src/components/feed/FeedClient.tsx`
- Modify: `src/components/feed/PostCard.tsx`

- [ ] **Schritt 1: FeedClient.tsx anpassen**

`src/components/feed/FeedClient.tsx` vollständig ersetzen:

```tsx
'use client'
import { useState, useCallback } from 'react'
import { PostCard } from './PostCard'
import { ImageModal } from './ImageModal'
import { createClient } from '@/lib/supabase/client'
import { thumbPath } from '@/lib/thumb'

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

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

  function getImageUrl(storagePath: string) {
    return `${base}/uploads/${storagePath}`
  }

  function getThumbUrl(storagePath: string) {
    return `${base}/uploads/${thumbPath(storagePath)}`
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
            thumbnailUrl: post.images ? getThumbUrl(post.images.storage_path) : '',
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
```

- [ ] **Schritt 2: PostCard.tsx anpassen**

`src/components/feed/PostCard.tsx` vollständig ersetzen:

```tsx
'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Heart, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InlineComments } from './InlineComments'

type Post = {
  date: string
  imageUrl: string
  thumbnailUrl: string
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
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [showComments, setShowComments] = useState(false)
  const supabase = createClient()

  async function toggleLike() {
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(c => c + (newLiked ? 1 : -1))

    const { error } = newLiked
      ? await supabase.from('likes').insert({ post_date: post.date, user_id: userId })
      : await supabase.from('likes').delete()
          .eq('post_date', post.date)
          .eq('user_id', userId)

    if (error) {
      setLiked(!newLiked)
      setLikeCount(c => c + (newLiked ? -1 : 1))
      console.error('Like error:', error.message)
    }
  }

  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden mb-6" id={`post-${post.date}`}>
      {/* Bild */}
      <div
        className="cursor-zoom-in overflow-hidden"
        onClick={() => onOpenModal(post.date)}
      >
        {post.thumbnailUrl && (
          <img
            src={post.thumbnailUrl}
            onError={e => { (e.target as HTMLImageElement).src = post.imageUrl }}
            alt={`Beitrag vom ${post.date}`}
            className="w-full h-auto block"
          />
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors
              ${liked ? 'text-gold' : 'text-muted-foreground hover:text-gold'}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-gold' : ''}`} />
            {likeCount}
          </button>
          <button
            onClick={() => setShowComments(s => !s)}
            className={`flex items-center gap-1.5 text-sm transition-colors
              ${showComments ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageCircle className="h-4 w-4" />
            {commentCount}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(new Date(post.date), 'd. MMMM yyyy', { locale: de })}
        </p>
      </div>

      {/* Inline Kommentare */}
      {showComments && (
        <InlineComments
          date={post.date}
          userId={userId}
          onCommentAdded={() => setCommentCount(c => c + 1)}
        />
      )}
    </article>
  )
}
```

- [ ] **Schritt 3: Visuell testen**

Dev-Server starten (`npm run dev`), Feed aufrufen. Prüfen:
- Hochformat-Bilder erscheinen vollständig ohne Abschneiden
- Querformat-Bilder erscheinen wie bisher
- Klick auf Bild öffnet Modal mit Original
- Browser-DevTools → Network: Feed lädt `*-thumb.jpg` statt Originale

- [ ] **Schritt 4: Commit**

```bash
git add src/components/feed/FeedClient.tsx src/components/feed/PostCard.tsx
git commit -m "feat: natural aspect ratio in feed, load thumbnails instead of originals"
```

---

## Task 5: Admin-Grid auf Thumbnails umstellen

**Files:**
- Modify: `src/components/admin/ImagePoolClient.tsx`

- [ ] **Schritt 1: ImagePoolClient.tsx anpassen**

In `src/components/admin/ImagePoolClient.tsx` die Import-Zeile am Anfang ergänzen:

```ts
import { thumbPath } from '@/lib/thumb'
```

Dann die `getUrl`-Funktion ersetzen:

```ts
function getUrl(path: string) {
  return apiUrl(`/uploads/${thumbPath(path)}`)
}
```

Keine weiteren Änderungen nötig — `aspect-square` + `object-cover` bleibt für einheitliche Admin-Kacheln.

- [ ] **Schritt 2: Visuell testen**

Admin-Bereich → Bilder aufrufen. Prüfen:
- Bilder laden deutlich schneller
- Grid sieht gleich aus (quadratische Kacheln, gecroppt)
- Browser-DevTools → Network: Grid lädt `*-thumb.jpg`

- [ ] **Schritt 3: Abschlusstests**

```bash
npm test
```

Erwartet: alle bestehen

- [ ] **Schritt 4: Commit**

```bash
git add src/components/admin/ImagePoolClient.tsx
git commit -m "feat: use thumbnails in admin image pool grid"
```
