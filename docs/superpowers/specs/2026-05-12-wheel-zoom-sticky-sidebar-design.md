# Design: Wheel Zoom & Sticky Sidebar

**Datum:** 2026-05-12  
**Status:** Approved

---

## Feature 1: Sticky Sidebar

### Ziel
Das Kalender-Widget und die Archivliste sollen beim Scrollen im Feed sichtbar bleiben.

### Änderung
`src/app/(subscriber)/layout.tsx` — `<aside>` bekommt `sticky top-20`:

```tsx
<aside className="w-72 shrink-0 hidden lg:block sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
```

- `sticky top-20`: klebt unterhalb der TopNav (ca. 80px)
- `max-h-[calc(100vh-5rem)]`: verhindert Überlauf, falls ArchiveList lang wird
- `overflow-y-auto`: scrollbar innerhalb der Sidebar falls nötig

**Betroffene Dateien:** `src/app/(subscriber)/layout.tsx` (1 Zeile)

---

## Feature 2: Mausrad-Zoom in der Vollbildansicht

### Ziel
In der `ImageModal`-Komponente soll das Mausrad den Zoom feingranular steuern. Der bestehende Zoom-Button bleibt als Fit/2×-Toggle erhalten.

### State-Änderung
`zoomed: boolean` → `scale: number` (Startwert: 1)

| scale | Verhalten |
|-------|-----------|
| 1     | Fit-Mode: `object-contain`, kein Pan |
| > 1   | Zoom-Mode: zentriert, pan-fähig, CSS `scale(${scale})` |

### Wheel-Handler
```typescript
function handleWheel(e: React.WheelEvent) {
  e.preventDefault()
  setScale(s => {
    const next = s - e.deltaY * 0.001 * s
    return Math.min(5, Math.max(1, next))
  })
}
```
- `onWheel` auf dem Image-Container-Div
- Min: 1 (= Fit), Max: 5×
- Wenn `scale` auf 1 zurückfällt: Pan auf `{x: 0, y: 0}` zurücksetzen

### Zoom-Button
Statt `setZoomed(z => !z)`:
```typescript
setScale(s => s > 1 ? 1 : 2)
setPan({ x: 0, y: 0 })
```
Icon-Logik: `scale > 1` → ZoomOut, sonst ZoomIn.

### Image-Rendering
Einheitlich für scale ≥ 1:
- **scale = 1:** `<img className="absolute inset-0 w-full h-full object-contain">` (unverändert)
- **scale > 1:** `<img style={{ transform: 'translate(calc(-50% + panX), calc(-50% + panY)) scale(${scale})', ... }}>` (wie jetzt, aber mit scale)

### Pan-Reset
Wenn `scale` auf 1 fällt (via Button oder Wheel), wird `pan` auf `{x:0, y:0}` zurückgesetzt.

### Tastatur-Navigation
Pfeil-Navigation bleibt unverändert (nur aktiv wenn `scale = 1`, wie jetzt mit `zoomed`).

**Betroffene Dateien:** `src/components/feed/ImageModal.tsx`

---

## Nicht in Scope
- Touch/Pinch-Zoom (mobil)
- Zoom-Level-Anzeige (z.B. "2×")
- Smooth-Scroll-Animation
