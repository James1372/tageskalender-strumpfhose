-- Replaces app.admin_email GUC parameter (not available on Supabase Cloud)
-- with a simple settings table read by security definer functions.

create table if not exists public.app_settings (
  key   text primary key,
  value text not null default ''
);

-- No anon/authenticated access — only security definer functions can read this
alter table public.app_settings enable row level security;

-- Seed with empty placeholder; fill in real value via UPDATE after running migrations
insert into public.app_settings (key, value)
values ('admin_email', '')
on conflict (key) do nothing;

-- Update trigger function to read admin_email from table instead of GUC
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_admin_email text;
begin
  select value into v_admin_email
  from public.app_settings
  where key = 'admin_email';

  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when v_admin_email != '' and new.email = v_admin_email
         then 'admin' else 'user' end
  );
  return new;
end;
$$;
