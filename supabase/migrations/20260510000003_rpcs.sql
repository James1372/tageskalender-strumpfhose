create or replace function public.get_comment_counts()
returns table(post_date date, count bigint)
language sql security definer as $$
  select post_date, count(*) from public.comments group by post_date;
$$;
