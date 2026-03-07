
CREATE TABLE public.icps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  pain_points text DEFAULT '',
  content_goal text DEFAULT '',
  content_pillars text[] DEFAULT '{}',
  tone text DEFAULT '',
  decision_makers text DEFAULT '',
  motivations text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.icps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff full access to icps"
  ON public.icps FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their own icps"
  ON public.icps FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'client') AND client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Clients can insert their own icps"
  ON public.icps FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'client') AND client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Clients can update their own icps"
  ON public.icps FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'client') AND client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Clients can delete their own icps"
  ON public.icps FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'client') AND client_id = get_user_client_id(auth.uid()));
