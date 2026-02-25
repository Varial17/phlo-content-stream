CREATE POLICY "Clients can update their own brand profile"
ON public.brand_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'client'::app_role) AND client_id = get_user_client_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'client'::app_role) AND client_id = get_user_client_id(auth.uid()));