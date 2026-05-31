# Changelog

## [Unreleased]

---

## 2026-05-31 — Abo-Verwaltung in der Navigation

### Neu
- **Abo-Button im TopNav** für Abonnenten (nicht Admins) — Kreditkarten-Icon, auf Desktop mit "Abo"-Text. Öffnet das Stripe Customer Portal zum Kündigen, Zahlungsmethode ändern, Rechnungen einsehen. Auf allen Geräten sichtbar.

---

## 2026-05-31 — Admin-Dashboard klickbare Kacheln

### Geändert
- Dashboard-Kacheln sind jetzt klickbar: Bilder → `/admin/bilder`, Aktive Abos → `/admin/abonnenten`, Registrierte User → `/admin/user`

---

## 2026-05-31 — Admin-Abonnenten-Übersicht

### Neu
- **`/admin/abonnenten`** — neue Seite mit Tabelle aller Abonnements (E-Mail, Plan, Preis, Dauer, Beginn, Läuft bis, Status)
- Status-Badges farblich: Aktiv=grün, Toleranz=orange, Ausstehend=gelb, Gekündigt=grau
- Nav-Link "Abonnenten" in der Admin-Navigation ergänzt

### Entfernt
- Abonnenten-Zahl von der Landing Page entfernt

---

## 2026-05-31 — Thumbnails & natürliches Seitenverhältnis

### Neu
- **Thumbnail-Generierung beim Upload** — jedes hochgeladene Bild erzeugt automatisch eine 600px-breite JPEG-Version (`*-thumb.jpg`) via `sharp`
- **Migrationsskript** `scripts/generate-thumbnails.ts` — erstellt Thumbnails für alle bestehenden Bilder (idempotent)
- **`src/lib/thumb.ts`** — zentrale `thumbPath()`-Hilfsfunktion für konsistente Thumbnail-Pfade

### Geändert
- **Feed** lädt Thumbnails statt Originale → deutlich schnelleres Laden; `onError`-Fallback auf Original falls Thumbnail fehlt
- **Feed** zeigt Bilder im natürlichen Seitenverhältnis — Hochformate werden nicht mehr abgeschnitten
- **Admin-Bilderpool** lädt Thumbnails statt Originale → Grid lädt deutlich schneller
- **Upload-API** löscht beim Löschen eines Bildes auch den zugehörigen Thumbnail
- **Upload-API** bereinigt beide Dateien (Original + Thumbnail) wenn der DB-Insert fehlschlägt

### Unverändert
- Modal lädt weiterhin das Original in voller Größe

---

## 2026-05-19 — Mausrad-Zoom im Bild-Modal

- Stufenloses Zoomen per Mausrad im Vollbild-Modal
- Zoom-Button wechselt zwischen Fit und 2× Originalgröße
- Pan (Verschieben) bei gezoomtem Bild per Drag

## 2026-05-18 — Login-Status auf der Landing Page

- Eingeloggte User sehen in der Navigation ihren Namen und einen direkten Feed-Link

## Ältere Einträge

Siehe git log für vollständige Historie.
