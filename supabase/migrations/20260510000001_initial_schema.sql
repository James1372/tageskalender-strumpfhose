-- supabase/migrations/20260510000001_initial_schema.sql

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Images pool
create table public.images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  status text not null default 'available' check (status in ('available', 'used')),
  used_date date,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.profiles(id)
);

-- Daily posts
create table public.daily_posts (
  date date primary key,
  image_id uuid not null references public.images(id),
  created_at timestamptz not null default now()
);

-- Subscription plans
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  duration_months int not null,
  price_eur numeric(6,2) not null,
  discount_pct int not null default 0,
  is_featured bool not null default false,
  stripe_price_id text,
  active bool not null default true
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id),
  stripe_sub_id text unique,
  status text not null default 'active'
    check (status in ('active', 'past_due', 'canceled', 'grace')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Credits
create table public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('time', 'eur')),
  value numeric(8,2) not null,
  expires_at timestamptz,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  used bool not null default false
);

-- Likes
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, post_date)
);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_date date not null,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Seed default subscription plans
insert into public.subscription_plans (label, duration_months, price_eur, discount_pct, is_featured) values
  ('Monatlich', 1, 9.99, 0, false),
  ('3 Monate', 3, 25.47, 15, false),
  ('6 Monate', 6, 44.94, 25, true),
  ('Jährlich', 12, 71.88, 40, false);
