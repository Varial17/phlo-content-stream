-- Allow admins to update and delete user_profiles (needed for removing users from clients)
CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
