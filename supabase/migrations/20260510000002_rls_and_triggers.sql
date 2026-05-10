-- supabase/migrations/20260510000002_rls_and_triggers.sql

-- Helper: check if user has active access (subscription or valid credit)
create or replace function public.has_active_access(user_uuid uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and status in ('active', 'grace')
      and current_period_end > now()
  ) or exists (
    select 1 from public.credits
    where user_id = user_uuid
      and used = false
      and type = 'time'
      and (expires_at is null or expires_at > now())
  );
$$;

-- Rate-limit helper: max 5 comments per user per hour
create or replace function public.comment_rate_ok(user_uuid uuid)
returns boolean language sql security definer as $$
  select (
    select count(*) from public.comments
    where user_id = user_uuid
      and created_at > now() - interval '1 hour'
  ) < 5;
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = current_setting('app.admin_email', true)
         then 'admin' else 'user' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.images enable row level security;
alter table public.daily_posts enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credits enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- Profiles: users see own, admins see all
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Images: admins manage, subscribers read available
create policy "images_admin_all" on public.images
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "images_subscriber_select" on public.images
  for select using (public.has_active_access(auth.uid()));

-- Daily posts: subscribers read, admins all
create policy "daily_posts_subscriber_select" on public.daily_posts
  for select using (public.has_active_access(auth.uid()));
create policy "daily_posts_admin_all" on public.daily_posts
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Subscription plans: all can read active plans
create policy "plans_public_select" on public.subscription_plans
  for select using (active = true);
create policy "plans_admin_all" on public.subscription_plans
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Subscriptions: users see own
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = auth.uid());
create policy "subscriptions_admin_all" on public.subscriptions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Credits: users see own
create policy "credits_select_own" on public.credits
  for select using (user_id = auth.uid());
create policy "credits_admin_all" on public.credits
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Likes: subscribers read all, write own
create policy "likes_subscriber_select" on public.likes
  for select using (public.has_active_access(auth.uid()));
create policy "likes_insert_own" on public.likes
  for insert with check (user_id = auth.uid() and public.has_active_access(auth.uid()));
create policy "likes_delete_own" on public.likes
  for delete using (user_id = auth.uid());

-- Comments: subscribers read all, write own (with rate limit)
create policy "comments_subscriber_select" on public.comments
  for select using (public.has_active_access(auth.uid()));
create policy "comments_insert_own" on public.comments
  for insert with check (
    user_id = auth.uid()
    and public.has_active_access(auth.uid())
    and public.comment_rate_ok(auth.uid())
  );
create policy "comments_admin_delete" on public.comments
  for delete using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
