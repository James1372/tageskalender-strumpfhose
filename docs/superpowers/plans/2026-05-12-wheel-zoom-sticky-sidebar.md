# Wheel Zoom & Sticky Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mouse wheel zoom to the fullscreen image modal and make the feed sidebar sticky while scrolling.

**Architecture:** Two independent, minimal UI changes — one CSS class addition in the subscriber layout, one state refactor + wheel event handler in ImageModal. No new files needed.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS

---

### Task 1: Sticky Sidebar

**Files:**
- Modify: `src/app/(subscriber)/layout.tsx`

- [ ] **Step 1: Add sticky classes to the aside element**

In `src/app/(subscriber)/layout.tsx`, change:
```tsx
<aside className="w-72 shrink-0 hidden lg:block">
```
to:
```tsx
<aside className="w-72 shrink-0 hidden lg:block sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
```

`top-20` = 5rem, which clears the TopNav. `max-h` + `overflow-y-auto` ensures the sidebar scrolls internally if the archive list grows long.

- [ ] **Step 2: Commit and push**

```bash
git add src/app/\(subscriber\)/layout.tsx
git commit -m "feat: make sidebar sticky below top nav"
git push
```

---

### Task 2: Mouse Wheel Zoom in ImageModal

**Files:**
- Modify: `src/components/feed/ImageModal.tsx`

**Overview of changes:**  
Replace `zoomed: boolean` with `scale: number` (1 = fit, >1 = zoomed). Add a `containerRef` + native wheel event listener (`passive: false` required for `preventDefault`). Update button, cursor, pan guards, and image rendering.

- [ ] **Step 1: Replace `zoomed` state with `scale`**

In `src/components/feed/ImageModal.tsx`, replace:
```typescript
const [zoomed, setZoomed] = useState(false)
```
with:
```typescript
const [scale, setScale] = useState(1)
```

- [ ] **Step 2: Add `containerRef` for the wheel event**

Directly below the existing refs (`isDragging`, `dragStart`), add:
```typescript
const containerRef = useRef<HTMLDivElement>(null)
```

- [ ] **Step 3: Add wheel event useEffect**

After the keyboard navigation `useEffect` block, add:
```typescript
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
```

Must use native `addEventListener` with `{ passive: false }` — React's synthetic `onWheel` cannot reliably call `preventDefault()`.

- [ ] **Step 4: Reset scale (not zoomed) when navigating to a new date**

In the first `useEffect` (the `load()` function), the existing reset lines read:
```typescript
setZoomed(false)
setPan({ x: 0, y: 0 })
```
Replace with:
```typescript
setScale(1)
setPan({ x: 0, y: 0 })
```

- [ ] **Step 5: Update zoom button**

Find the button with `onClick={() => { setZoomed(z => !z); setPan({ x: 0, y: 0 }) }}`. Replace the entire button:
```tsx
<button
  onClick={() => { setScale(s => s > 1 ? 1 : 2); setPan({ x: 0, y: 0 }) }}
  className="p-2 rounded-full bg-black/40 text-white hover:text-gold transition-colors"
  title={scale > 1 ? 'Einpassen (Fit)' : '1:1 Originalgröße'}
>
  {scale > 1 ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
</button>
```

- [ ] **Step 6: Update cursor, pan guards, and keyboard guard**

**Cursor class on image area div** — change:
```typescript
${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
```
to:
```typescript
${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
```

**`handleMouseDown`** — change:
```typescript
if (!zoomed) return
```
to:
```typescript
if (scale <= 1) return
```

**Keyboard nav guard** inside the keydown `useEffect` — change:
```typescript
if (zoomed) return // In zoom mode, arrows pan instead of navigate
```
to:
```typescript
if (scale > 1) return // In zoom mode, arrows pan instead of navigate
```

- [ ] **Step 7: Attach ref to container div and update image rendering**

Find the image area `<div>` (the one with `flex-1 overflow-hidden relative`). Add `ref={containerRef}` to it:
```tsx
<div
  ref={containerRef}
  className={`flex-1 overflow-hidden relative
    ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
>
```

Then replace the two separate `{!zoomed && (...)}` and `{zoomed && (...)}` image blocks with:
```tsx
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
```

- [ ] **Step 8: Commit and push**

```bash
git add src/components/feed/ImageModal.tsx
git commit -m "feat: add mouse wheel zoom to image modal"
git push
```
