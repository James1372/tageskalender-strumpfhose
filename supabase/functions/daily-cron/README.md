# daily-cron Edge Function

Runs daily at 22:00 UTC (= 00:00 CET / 01:00 CEST) to select a random image from the pool and create the daily post.

## Deploy

```bash
supabase functions deploy daily-cron
```

## Schedule (production)

Set up the cron in Supabase Dashboard → Edge Functions → daily-cron → Schedule:
- Cron expression: `0 22 * * *`

Or via pg_cron SQL (if enabled):
```sql
select cron.schedule(
  'daily-image-cron',
  '0 22 * * *',
  $$ select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-cron',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) $$
);
```

## Environment Variables Required

- `SUPABASE_URL` — auto-injected by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by Supabase
- `ADMIN_WEBHOOK_URL` (optional) — Slack/Discord webhook for error notifications
