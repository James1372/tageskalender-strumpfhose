# Design: Thumbnails & natürliches Seitenverhältnis im Feed

**Datum:** 2026-05-31  
**Status:** Approved

## Ziel

1. Bilder im Feed im natürlichen Seitenverhältnis anzeigen (kein Crop von Hochformaten)
2. Feed und Admin-Bereich laden kleine Thumbnail-Versionen (600px) statt Originale
3. Modal lädt weiterhin das Original in voller Größe
4. Einmalige Migration erstellt Thumbnails für alle bestehenden Bilder

## Architektur

### Thumbnail-Konvention (Ansatz A)

Thumbnails liegen neben dem Original im gleichen Ordner:

```
/public/uploads/1234-abc.jpg        ← Original
/public/uploads/1234-abc-thumb.jpg  ← Thumbnail (600px breit, JPEG q80)
```

Die Hilfsfunktion `thumbPath(storagePath: string): string` ersetzt die Extension durch `-thumb.jpg`:

```ts
// src/lib/thumb.ts
export function thumbPath(storagePath: string): string {
  return storagePath.replace(/\.[^.]+$/, '-thumb.jpg')
}
```

Zentraler Ort, von Feed, Admin und Upload-API verwendet.

## Komponenten und Änderungen

### 1. Upload-API (`src/app/api/admin/images/route.ts`)

Nach dem Speichern des Originals:

```
sharp(buffer)
  .resize(600)           // Breite 600px, Höhe proportional
  .jpeg({ quality: 80 })
  .toFile(thumbFilePath)
```

- Thumbnail-Name: `${nameWithoutExt}-thumb.jpg` (immer JPEG)
- `sharp` als neue Dependency: `npm install sharp`
- Fehler bei Thumbnail-Generierung: geloggt, Upload gilt trotzdem als erfolgreich
- Keine DB-Schema-Änderungen

### 2. Feed (`src/components/feed/`)

**FeedClient.tsx:**
- Neue `getThumbUrl(storagePath)` neben `getImageUrl()` — nutzt `thumbPath()`
- `PostCard` erhält `thumbnailUrl` (Thumb) und `imageUrl` (Original als onError-Fallback)

**PostCard.tsx:**
- Bildcontainer: `aspect-[4/3]` + absolut positioniertes `<img>` mit `object-cover` wird ersetzt
- Neu: einfaches `<img className="w-full h-auto block" src={thumbnailUrl} />`
- Bild bestimmt die Höhe selbst — Hochformate werden hoch, Querformate breit
- `onClick` öffnet Modal mit der Original-URL (unverändert)

**ImageModal.tsx:** Keine Änderungen — lädt Original weiterhin via Supabase-Query.

### 3. Admin (`src/components/admin/ImagePoolClient.tsx`)

- `getUrl()` wird durch `getThumbUrl()` ersetzt (nutzt `thumbPath()`)
- `aspect-square` + `object-cover` bleibt — einheitliche Kacheln im Admin-Grid sind gewünscht
- Thumbnails sind 600px, Grid zeigt ~150-200px → deutlich schnelleres Laden

### 4. Migrations-Script (`scripts/generate-thumbnails.ts`)

- Liest alle Dateien in `/public/uploads/` die nicht auf `-thumb.jpg` enden
- Überspringt Dateien, für die bereits ein `-thumb.jpg` existiert (idempotent)
- Generiert Thumbnail: 600px breit, JPEG q80
- Loggt Fortschritt und Fehler pro Datei
- Ausführen: `npx tsx scripts/generate-thumbnails.ts`

## Fallback

Wenn ein Thumbnail fehlt (z.B. Generierung fehlgeschlagen), zeigt der Feed das Original. Dies wird im `<img>`-Tag über `onError` umgesetzt:

```tsx
<img
  src={thumbnailUrl}
  onError={e => { (e.target as HTMLImageElement).src = imageUrl }}
  className="w-full h-auto block"
/>
```

## Nicht im Scope

- Mehrere Thumbnail-Größen (eine Größe für Feed und Admin reicht)
- WebP-Konvertierung
- CDN-Integration
- Lazy-Loading-Placeholder (Blur-up, LQIP)
