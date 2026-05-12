# Deployment Guide — Tageskalender Strumpfhose

## Architektur (Option B — vServer)

- **Next.js** läuft auf dem vServer via pm2
- **Supabase Cloud (Free)** — nur für PostgreSQL + Auth
- **Bilder** liegen auf dem vServer unter `public/uploads/`
- **Cron** läuft via Linux `crontab`

---

## 1. Supabase Setup

1. Projekt auf [supabase.com](https://supabase.com) erstellen
2. Migrations anwenden: im Supabase SQL-Editor alle Dateien aus `supabase/migrations/` der Reihe nach ausführen
3. Auth-Einstellungen:
   - Site URL: `https://bellabianca.at/daily`
   - Redirect URLs: `https://bellabianca.at/daily/auth/callback`
4. Admin-E-Mail setzen (SQL Editor):
   ```sql
   UPDATE public.app_settings SET value = 'deine@email.at' WHERE key = 'admin_email';
   ```
   > Migration 8 legt die `app_settings`-Tabelle an. Kein Superuser nötig.

---

## 2. Server Setup (vServer)

```bash
# Node.js 20 installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pm2 global installieren
npm install -g pm2

# Projekt klonen
git clone https://github.com/James1372/tageskalender-strumpfhose.git /var/www/tageskalender-strumpfhose
cd /var/www/tageskalender-strumpfhose

# Abhängigkeiten installieren
npm install

# Uploads-Verzeichnis anlegen
mkdir -p public/uploads

# Bilder aus Pool hierher kopieren
# rsync -av /pfad/zu/bildern/ public/uploads/

# .env.local anlegen
cp .env.example .env.local
nano .env.local  # Werte eintragen

# App bauen
npm run build

# pm2 starten
pm2 start npm --name "tageskalender" -- start
pm2 save
pm2 startup  # Autostart bei Serverrestart
```

---

## 3. Stripe Setup

1. API Keys eintragen in `.env.local`
2. Stripe-Preise einmalig erstellen:
   ```bash
   npx ts-node scripts/seed-stripe-prices.ts
   ```
3. Webhook-Endpoint anlegen: `https://bellabianca.at/daily/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.payment_failed`
4. Customer Portal in Stripe Dashboard aktivieren

---

## 4. nginx Konfiguration

```nginx
server {
    listen 443 ssl http2;
    server_name bellabianca.at;

    ssl_certificate     /etc/letsencrypt/live/bellabianca.at/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bellabianca.at/privkey.pem;

    # Bilder direkt von nginx mit Caching ausliefern
    location /daily/uploads/ {
        alias /var/www/tageskalender-strumpfhose/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Tageskalender unter /daily
    location /daily {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name bellabianca.at;
    return 301 https://$host$request_uri;
}
```

SSL via Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bellabianca.at
```

---

## 5. Täglicher Cron

```bash
crontab -e
```

Zeile hinzufügen (täglich um 00:02 UTC = 02:02 Wien-Zeit):
```
2 0 * * * curl -s -X POST http://localhost:3000/daily/api/cron/daily -H "Authorization: Bearer DEIN_CRON_SECRET" >> /var/log/tageskalender-cron.log 2>&1
```

> Die API berechnet das Datum in der Zeitzone `Europe/Vienna` — läuft also auch auf UTC-Servern korrekt.

Cron testen:
```bash
curl -s -X POST http://localhost:3000/daily/api/cron/daily \
  -H "Authorization: Bearer DEIN_CRON_SECRET" | python3 -m json.tool
```

---

## 6. Updates deployen

```bash
cd /var/www/tageskalender-strumpfhose
git pull
npm install
npm run build
pm2 restart tageskalender
```

---

## Smoke Test

- [ ] `/` — Landing Page: nicht eingeloggt → Login/Abonnieren; eingeloggt → Name + Feed-Button in Nav
- [ ] `/register` → `/subscribe` — Registrierung funktioniert
- [ ] Stripe Checkout — Test-Karte `4242 4242 4242 4242`
- [ ] `/feed` — Bild des Tages sichtbar (kein broken-image-Icon)
- [ ] Feed: Sidebar (Kalender) bleibt beim Scrollen sichtbar (sticky)
- [ ] Like — bleibt nach Refresh erhalten
- [ ] Kommentare — klappt inline auf
- [ ] Vollbild: Mausrad zoomt stufenlos (kein Sprung auf Originalgröße), Pan funktioniert
- [ ] Vollbild: Zoom-Button wechselt zwischen Fit und 2×
- [ ] `/admin/bilder` — Bild hochladen, erscheint sofort
- [ ] Cron-API — `POST /daily/api/cron/daily` mit Secret liefert Erfolg und korrektes Wien-Datum
