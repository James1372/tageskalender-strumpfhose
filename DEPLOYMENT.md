# Deployment Guide — Tageskalender Strumpfhose

## Prerequisites

- Supabase project created at supabase.com
- Stripe account with products configured (run `scripts/seed-stripe-prices.ts` once)
- Vercel account

## Steps

### 1. Supabase Setup

1. Create a new Supabase project
2. Apply migrations: `supabase db push` (or run SQL in Supabase SQL editor)
3. Create `images` storage bucket (public)
4. Enable Edge Functions
5. Deploy daily-cron: `supabase functions deploy daily-cron`
6. Set cron schedule: Dashboard → Edge Functions → daily-cron → Schedule → `0 22 * * *`
7. Set admin email in Supabase settings: `app.admin_email = your@email.com`

### 2. Stripe Setup

1. Get API keys from Stripe Dashboard
2. Run `npx ts-node scripts/seed-stripe-prices.ts` to create prices in Stripe
3. Create webhook endpoint: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.payment_failed`
4. Enable Customer Portal in Stripe Dashboard

### 3. Vercel Deployment

1. Connect GitHub repo to Vercel
2. Set environment variables (see `.env.example`)
3. Deploy: `vercel --prod`
4. Update Supabase Auth: Dashboard → Auth → URL Configuration
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/auth/callback`

## Smoke Test Checklist

- [ ] `/` — Landing page loads with blurred teaser
- [ ] `/register` — Registration works, redirects to `/subscribe`
- [ ] `/subscribe` — 4 plan cards visible
- [ ] Stripe checkout — Test card `4242 4242 4242 4242` completes
- [ ] `/feed` — Feed loads after successful checkout
- [ ] Feed scroll — Infinite scroll loads older posts
- [ ] Click image — Modal opens in standard mode
- [ ] Zoom button — Switches to pan mode (1:1)
- [ ] Like button — Optimistic update works
- [ ] Comments — Can post, rate limit enforced after 5
- [ ] Calendar — Today highlighted, posted days clickable
- [ ] `/archiv/[year]/[month]` — Archive month loads correctly
- [ ] `/admin` — Only accessible to admin user
- [ ] `/admin/bilder` — Upload images, delete available ones
- [ ] `/admin/user` — Grant time/EUR credit to user
- [ ] `/admin/abos` — Edit plan prices and featured status
- [ ] Dark/Light toggle — Persists in localStorage
