'use client'
import { useState, useRef } from 'react'
import { apiUrl } from '@/lib/api'
import Image from 'next/image'
import { Trash2, Upload, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Img = {
  id: string
  storage_path: string
  status: string
  used_date: string | null
}

export function ImagePoolClient({ images: initial, availableCount }: {
  images: Img[]
  availableCount: number
}) {
  const [images, setImages] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function getUrl(path: string) {
    return `/uploads/${path}`
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    setUploadProgress(`Lade ${files.length} Bild${files.length > 1 ? 'er' : ''} hoch...`)

    const fd = new FormData()
    Array.from(files).forEach(f => fd.append('files', f))

    const res = await fetch(apiUrl('/api/admin/images'), { method: 'POST', body: fd })
    const { results } = await res.json()
    const errors = results.filter((r: any) => r.error)

    setUploading(false)
    setUploadProgress(null)
    if (inputRef.current) inputRef.current.value = ''

    if (errors.length > 0) {
      alert(`${errors.length} Fehler beim Upload: ${errors.map((e: any) => e.error).join(', ')}`)
    }
    // Reload to show new images
    window.location.reload()
  }

  async function handleDelete(imageId: string) {
    if (!confirm('Bild wirklich löschen?')) return
    const res = await fetch(apiUrl('/api/admin/images'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    })
    if (res.ok) {
      setImages(imgs => imgs.filter(i => i.id !== imageId))
    } else {
      const { error } = await res.json()
      alert(error)
    }
  }

  const available = images.filter(i => i.status === 'available').length
  const used = images.length - available
  const lowPool = available < 14

  return (
    <>
      {lowPool && (
        <div className="flex items-center gap-2 bg-yellow-950 border border-yellow-700
          text-yellow-300 rounded-lg px-4 py-3 mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">
            Nur noch <strong>{available}</strong> Bilder verfügbar. Bitte mehr hochladen.
          </p>
        </div>
      )}

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-sm text-muted-foreground">{available} verfügbar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
          <span className="text-sm text-muted-foreground">{used} verwendet</span>
        </div>
        <div className="ml-auto">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploadProgress ?? 'Bilder hochladen'}
          </Button>
        </div>
      </div>

      {images.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          Noch keine Bilder im Pool. Lade dein erstes Bild hoch.
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {images.map(img => (
          <div
            key={img.id}
            className="relative group aspect-square bg-card border border-border rounded-lg overflow-hidden"
          >
            <Image
              src={getUrl(img.storage_path)}
              alt=""
              fill
              className="object-cover"
              sizes="150px"
            />
            {/* Status indicator */}
            <div className={`absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full
              ${img.status === 'available' ? 'bg-green-400' : 'bg-gray-500'}`}
            />
            {/* Used date */}
            {img.used_date && (
              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-xs
                text-center py-0.5 text-gray-300">
                {img.used_date}
              </div>
            )}
            {/* Delete button (available only) */}
            {img.status === 'available' && (
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded
                  opacity-0 group-hover:opacity-100 transition-opacity
                  text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
