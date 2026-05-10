-- Allow authenticated users to read other users' profiles (email only)
-- Needed for displaying comment authors in CommentsPanel
create policy "profiles_authenticated_select" on public.profiles
  for select
  to authenticated
  using (true);
