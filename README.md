# Tageskalender Strumpfhose

Täglich ein exklusives Bild — nur für Abonnenten. Betrieben unter [bellabianca.at/daily](https://bellabianca.at/daily).

## Stack

- **Next.js** (App Router) — Server-Side Rendering, `basePath: '/daily'`
- **Supabase Cloud** — PostgreSQL + Auth
- **Stripe** — Abo-Zahlungen (9,99 €/Monat)
- **pm2** auf World4You vServer
- **Bilder** lokal unter `public/uploads/` (~985 Bilder, 4,8 GB)
- **Cron** via Linux `crontab` → POST `/daily/api/cron/daily`

## Features

- Tägliches Bild aus dem Bildpool (zufällig, Cron um Mitternacht)
- Feed mit Infinite Scroll, Sticky Sidebar (Kalender + Archiv)
- Vollbild-Lightbox mit Mausrad-Zoom (1×–5×) und Pan
- Likes & Kommentare (nur für eingeloggte Abonnenten)
- Admin-Bereich: Bildpool verwalten, Abos & User einsehen
- Stripe Webhook für Abo-Verwaltung

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local   # Supabase + Stripe Keys eintragen
npm run dev
```

App läuft auf [http://localhost:3000](http://localhost:3000) — ohne `basePath`, da nur lokal.

## Deployment

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für die vollständige Anleitung.

## Tests

```bash
npm test          # Jest Unit Tests
npm run test:e2e  # Playwright E2E (braucht laufende App)
```
