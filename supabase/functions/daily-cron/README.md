# daily-cron (nicht verwendet)

Diese Supabase Edge Function ist ein alternativer Ansatz für den täglichen Cron-Job.

**Aktuell wird sie nicht eingesetzt.** Der Cron läuft stattdessen via Linux `crontab` auf dem vServer und ruft direkt die Next.js API-Route auf:

```
2 0 * * * curl -s -X POST http://localhost:3000/daily/api/cron/daily \
  -H "Authorization: Bearer $CRON_SECRET" >> /var/log/tageskalender-cron.log 2>&1
```

Siehe [DEPLOYMENT.md](../../DEPLOYMENT.md#5-täglicher-cron) für Details.
