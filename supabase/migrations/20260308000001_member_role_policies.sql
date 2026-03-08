-- Run in a separate migration because PostgreSQL cannot use a newly added enum
-- value in the same transaction as ALTER TYPE ... ADD VALUE

-- Add email column to user_profiles for team member display
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email text;

-- Update handle_new_user trigger to populate email and auto-assign
-- role + client_id from invite metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, client_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'client_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Member RLS policies
CREATE POLICY "Members can view their own client record"
  ON public.clients FOR SELECT TO authenticated
  USING (id = public.get_user_client_id(auth.uid()) AND public.has_role(auth.uid(), 'member'));

CREATE POLICY "Business owners can view their own client record"
  ON public.clients FOR SELECT TO authenticated
  USING (id = public.get_user_client_id(auth.uid()) AND public.has_role(auth.uid(), 'business_owner'));

CREATE POLICY "Members can view their org posts"
  ON public.posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'member') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Members can update their org posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'member') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Business owners can view their org posts"
  ON public.posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'business_owner') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Business owners can update their org posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'business_owner') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Members can view their org ideas"
  ON public.ideas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'member') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Members can update their org ideas"
  ON public.ideas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'member') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Business owners can view their org ideas"
  ON public.ideas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'business_owner') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Business owners can update their org ideas"
  ON public.ideas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'business_owner') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Members can view their brand profile"
  ON public.brand_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'member') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Business owners can view their brand profile"
  ON public.brand_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'business_owner') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Business owners can update their brand profile"
  ON public.brand_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'business_owner') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Members can view their org icps"
  ON public.icps FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'member') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Business owners can view their org icps"
  ON public.icps FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'business_owner') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Business owners can manage their org icps"
  ON public.icps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'business_owner') AND client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Client users can view team members in same org"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (
    client_id IS NOT NULL
    AND client_id = public.get_user_client_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'client')
      OR public.has_role(auth.uid(), 'business_owner')
      OR public.has_role(auth.uid(), 'member')
    )
  );
