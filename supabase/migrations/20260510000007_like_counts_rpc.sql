create or replace function public.get_like_counts()
returns table(post_date date, count bigint)
language sql security definer as $$
  select post_date, count(*) from public.likes group by post_date;
$$;

create or replace function public.get_user_likes(user_uuid uuid)
returns table(post_date date)
language sql security definer as $$
  select post_date from public.likes where user_id = user_uuid;
$$;
