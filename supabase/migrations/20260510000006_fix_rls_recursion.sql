-- Fix: infinite recursion in profiles RLS policy.
-- The admin_all policy queried profiles from within a profiles policy → loop.
-- Solution: use a security definer function that bypasses RLS.

create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Drop all policies that used the recursive admin check
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "images_admin_all" on public.images;
drop policy if exists "daily_posts_admin_all" on public.daily_posts;
drop policy if exists "plans_admin_all" on public.subscription_plans;
drop policy if exists "subscriptions_admin_all" on public.subscriptions;
drop policy if exists "credits_admin_all" on public.credits;
drop policy if exists "comments_admin_delete" on public.comments;

-- Recreate using is_admin() instead of direct profiles query
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

create policy "images_admin_all" on public.images
  for all using (public.is_admin());

create policy "daily_posts_admin_all" on public.daily_posts
  for all using (public.is_admin());

create policy "plans_admin_all" on public.subscription_plans
  for all using (public.is_admin());

create policy "subscriptions_admin_all" on public.subscriptions
  for all using (public.is_admin());

create policy "credits_admin_all" on public.credits
  for all using (public.is_admin());

create policy "comments_admin_delete" on public.comments
  for delete using (
    user_id = auth.uid() or public.is_admin()
  );
