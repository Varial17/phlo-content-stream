
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'client');

-- Clients table
CREATE TABLE public.clients (
  id text PRIMARY KEY,
  name text NOT NULL,
  initials text NOT NULL,
  color text NOT NULL,
  plan text DEFAULT 'active',
  billing_status text DEFAULT 'paid',
  next_billing date,
  joined date,
  contact_email text,
  channels text[],
  linkedin_followers int DEFAULT 0,
  follower_growth text DEFAULT '—',
  created_at timestamptz DEFAULT now()
);

-- User profiles (no role here — roles go in user_roles)
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  client_id text REFERENCES public.clients(id),
  created_at timestamptz DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Posts table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text REFERENCES public.clients(id) NOT NULL,
  channel text NOT NULL,
  hook text NOT NULL,
  body text,
  status text DEFAULT 'draft',
  assigned_to text,
  scheduled_date date,
  scheduled_time text,
  due_date date,
  client_change_request text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ideas table
CREATE TABLE public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text REFERENCES public.clients(id) NOT NULL,
  hook text NOT NULL,
  angle text,
  channel text[],
  relevance int,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get user's client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.user_profiles WHERE id = _user_id
$$;

-- CLIENTS policies
CREATE POLICY "Admins and staff can do everything on clients"
  ON public.clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their own client record"
  ON public.clients FOR SELECT TO authenticated
  USING (id = public.get_user_client_id(auth.uid()));

-- USER_PROFILES policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profile auto-creation"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- USER_ROLES policies
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- POSTS policies
CREATE POLICY "Admins and staff full access to posts"
  ON public.posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their own posts"
  ON public.posts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND client_id = public.get_user_client_id(auth.uid())
  );

CREATE POLICY "Clients can update their own posts (change request only)"
  ON public.posts FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND client_id = public.get_user_client_id(auth.uid())
  );

-- IDEAS policies
CREATE POLICY "Admins and staff full access to ideas"
  ON public.ideas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their own ideas"
  ON public.ideas FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND client_id = public.get_user_client_id(auth.uid())
  );

CREATE POLICY "Clients can update their own ideas"
  ON public.ideas FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'client')
    AND client_id = public.get_user_client_id(auth.uid())
  );

-- Trigger for updated_at on posts
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed clients
INSERT INTO public.clients VALUES
  ('hfg', 'Hash Financial Group', 'HF', '#3B82F6', 'active', 'paid', '2026-03-01', '2026-01-15', 'sarah@hashfinancial.com.au', '{linkedin,threads,email}', 387, '+24%'),
  ('rb', 'Real Balance Financial', 'RB', '#10B981', 'active', 'paid', '2026-03-03', '2026-01-20', 'craig@realbalance.com.au', '{linkedin,email}', 512, '+18%'),
  ('sf', 'Studyfin', 'SF', '#8B5CF6', 'active', 'overdue', '2026-02-15', '2026-02-01', 'accounts@studyfin.com.au', '{linkedin,threads}', 203, '+9%'),
  ('sg', 'Sapien Group', 'SG', '#F59E0B', 'active', 'paid', '2026-03-05', '2026-02-05', 'admin@sapiengroup.com.au', '{linkedin}', 298, '+31%'),
  ('mp', 'Meridian Partners', 'MP', '#EC4899', 'trial', 'trial', '2026-03-07', '2026-02-21', 'hello@meridianpartners.com.au', '{linkedin}', 89, '—');

-- Seed posts for HFG (February 2026)
INSERT INTO public.posts (client_id, channel, hook, body, status, assigned_to, scheduled_date, scheduled_time) VALUES
  ('hfg', 'linkedin', 'Why the ATO''s new SMSF reporting rules are actually good news', 'The ATO has introduced new quarterly reporting requirements for SMSFs with assets over $5M. While this might seem like more red tape, it actually creates an opportunity for proactive advisors.\n\nHere''s why:\n1. Earlier detection of compliance issues\n2. Better data for investment decisions\n3. Stronger trustee accountability\n\nThe firms that embrace this change will stand out. The ones that resist it will fall behind.', 'published', 'Anh Nguyen', '2026-02-02', '9:00 AM'),
  ('hfg', 'threads', 'Hot take: Most accountants are leaving money on the table with their LinkedIn', 'Quick thread on why I think every accounting firm should be posting on LinkedIn (and most don''t).', 'published', 'Anh Nguyen', '2026-02-03', '12:00 PM'),
  ('hfg', 'email', 'February Market Update: What the RBA decision means for your portfolio', 'Dear clients,\n\nThe RBA held rates steady this month at 3.85%. Here''s what this means for different asset classes and what we recommend reviewing before EOFY.', 'published', 'James Pham', '2026-02-04', '8:00 AM'),
  ('hfg', 'linkedin', '3 things every SMSF trustee needs to know before 30 June', 'With the end of financial year approaching faster than you think, here are three critical items every SMSF trustee should have on their radar.\n\n1. Contribution caps have changed — again\n2. The transfer balance cap indexation is now $1.9M\n3. In-specie contributions have new documentation requirements\n\nDon''t wait until May to start planning. The best outcomes come from preparation, not reaction.', 'approved', 'Anh Nguyen', '2026-02-10', '9:00 AM'),
  ('hfg', 'threads', 'The one conversation every accountant avoids (and why it costs you referrals)', 'Nobody wants to talk about succession planning with their clients. But the firms that do? They get referred to the next generation.', 'approved', 'James Pham', '2026-02-11', '11:00 AM'),
  ('hfg', 'linkedin', 'We helped a client save $40K in tax last year. Here''s what we did differently.', 'It wasn''t a magic trick. It was a structured approach to tax planning that started in July, not April.\n\nThe key difference was timing and communication. We scheduled quarterly reviews instead of annual catch-ups, and used each one to adjust the strategy based on actual performance, not projections.', 'pending', 'Anh Nguyen', '2026-02-14', '9:00 AM'),
  ('hfg', 'email', 'SMSF Quarterly Compliance Checklist', 'Here''s your quarterly compliance checklist for Q3 FY2026. Please review each item and confirm completion with your advisor.', 'pending', 'James Pham', '2026-02-17', '8:00 AM'),
  ('hfg', 'linkedin', 'Trust distributions explained in plain English (finally)', 'Trust distributions don''t have to be complicated. Here''s a simple framework for understanding how they work and what your options are as a trustee.', 'pending', 'Anh Nguyen', '2026-02-19', '9:00 AM'),
  ('hfg', 'threads', 'FBT season is here. What''s changed and what hasn''t.', 'Fringe benefits tax return deadline is coming up. Here''s a quick rundown of the key changes for 2026.', 'pending', 'James Pham', '2026-02-20', '10:00 AM'),
  ('hfg', 'linkedin', 'The myth of the set and forget investment portfolio', 'Set and forget sounds appealing. But in practice, the portfolios that perform best are the ones that get reviewed regularly.\n\nHere''s what a proper review cadence looks like for different client profiles.', 'draft', 'Anh Nguyen', '2026-02-24', '9:00 AM'),
  ('hfg', 'linkedin', 'End of financial year checklist: what your clients should be doing right now', 'It''s never too early to start EOFY planning. Here are the top 10 items every client should be thinking about.', 'draft', NULL, '2026-02-26', '9:00 AM'),
  ('hfg', 'email', 'March Newsletter: New Financial Year Planning Guide', 'Planning ahead for FY2027 starts now. This guide covers the key dates, thresholds, and strategy considerations.', 'draft', NULL, '2026-02-28', '8:00 AM');

-- Seed posts for other clients
INSERT INTO public.posts (client_id, channel, hook, body, status, assigned_to, scheduled_date, scheduled_time) VALUES
  ('rb', 'linkedin', 'Why your financial plan needs a stress test', 'Markets don''t move in straight lines. Neither should your planning assumptions.', 'approved', 'Anh Nguyen', '2026-02-12', '9:00 AM'),
  ('rb', 'email', 'Monthly Portfolio Review — February 2026', 'Your monthly performance summary and outlook.', 'published', 'James Pham', '2026-02-05', '8:00 AM'),
  ('sf', 'linkedin', 'Student debt strategies most graduates don''t know about', 'The HELP debt indexation rate just changed. Here''s what it means.', 'pending', 'Anh Nguyen', '2026-02-15', '10:00 AM'),
  ('sf', 'threads', 'Study now, save later: the tax benefits of education', 'Quick tips on claiming education-related expenses.', 'draft', NULL, '2026-02-22', '12:00 PM'),
  ('sg', 'linkedin', 'How Sapien Group is rethinking wealth management for Gen X', 'The sandwich generation needs a different approach.', 'approved', 'James Pham', '2026-02-18', '9:00 AM');

-- Seed ideas for HFG
INSERT INTO public.ideas (client_id, hook, angle, channel, relevance, status) VALUES
  ('hfg', 'Why the ATO''s new SMSF reporting rules are actually good news for your clients', 'Educational', '{linkedin}', 9, 'drafted'),
  ('hfg', 'The one conversation every accountant avoids (and why it costs you referrals)', 'Opinion', '{linkedin,threads}', 8, 'drafted'),
  ('hfg', 'End of financial year checklist: what your clients should be doing right now', 'Educational', '{linkedin,email}', 10, 'queued'),
  ('hfg', '3 things I wish I knew before advising my first SMSF trustee', 'Story', '{linkedin}', 7, 'new'),
  ('hfg', 'What the RBA''s decision this week means for your clients'' cash flow', 'Trending', '{linkedin,threads}', 9, 'new'),
  ('hfg', 'We helped a client save $40K in tax last year. Here''s what we did differently.', 'Case Study', '{linkedin}', 8, 'queued'),
  ('hfg', 'The myth of the set and forget investment portfolio', 'Opinion', '{linkedin}', 7, 'new'),
  ('hfg', 'Trust distributions explained in plain English (finally)', 'Educational', '{linkedin,email}', 8, 'new'),
  ('hfg', 'Why I think every accounting firm should post on LinkedIn (and most don''t)', 'Opinion', '{linkedin,threads}', 6, 'new'),
  ('hfg', 'Fringe benefits tax season: what''s changed and what hasn''t', 'Educational', '{linkedin,threads}', 9, 'new'),
  ('hfg', 'How to talk to clients about crypto without looking clueless', 'Educational', '{linkedin}', 5, 'new'),
  ('hfg', 'The hidden cost of not having a succession plan', 'Opinion', '{linkedin,email}', 7, 'new'),
  ('hfg', 'Client case study: restructuring a family trust for tax efficiency', 'Case Study', '{linkedin}', 8, 'new'),
  ('hfg', 'Market volatility is back. Here''s how to talk to nervous clients.', 'Trending', '{linkedin,threads}', 9, 'new'),
  ('hfg', 'Behind the scenes: how we onboard a new SMSF client in 5 steps', 'Story', '{linkedin}', 6, 'new');
