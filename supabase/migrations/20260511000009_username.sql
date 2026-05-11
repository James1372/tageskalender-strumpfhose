-- Add username to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Update trigger to capture username from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_email text;
BEGIN
  SELECT value INTO v_admin_email
  FROM public.app_settings
  WHERE key = 'admin_email';

  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    CASE WHEN v_admin_email != '' AND new.email = v_admin_email
         THEN 'admin' ELSE 'user' END
  );
  RETURN new;
END;
$$;
