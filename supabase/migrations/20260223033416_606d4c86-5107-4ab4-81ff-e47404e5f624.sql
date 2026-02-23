
-- brand_profiles table
CREATE TABLE public.brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  website_url text,
  business_description text,
  industry text,
  target_audience text,
  services text[],
  location text,
  tone_of_voice text,
  writing_style_notes text,
  writing_examples text,
  words_to_avoid text[],
  words_to_use text[],
  content_pillars text[],
  topics_to_avoid text[],
  competitors text[],
  post_length_linkedin text DEFAULT 'medium',
  post_length_threads text DEFAULT 'short',
  use_emojis boolean DEFAULT false,
  use_hashtags boolean DEFAULT false,
  cta_style text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin full access to brand_profiles"
  ON public.brand_profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Clients can view their own brand profile"
  ON public.brand_profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'client'::app_role) AND client_id = get_user_client_id(auth.uid()));

-- ai_logs table
CREATE TABLE public.ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text REFERENCES public.clients(id),
  function_name text,
  input_tokens int,
  output_tokens int,
  success boolean,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin access to ai_logs"
  ON public.ai_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Add columns to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.ideas(id);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false;

-- Add columns to ideas
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS source_summary text;

-- Trigger for brand_profiles updated_at
CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed brand profiles
INSERT INTO public.brand_profiles (client_id, website_url, business_description, industry, target_audience, tone_of_voice, content_pillars, post_length_linkedin, use_emojis, use_hashtags)
VALUES
  ('hfg', 'hashfinancial.com.au', 'Hash Financial Group is a Sydney-based financial services firm specialising in SMSF management, alternative investments, and wealth structuring for high-net-worth individuals and family offices.', 'financial services', 'HNW individuals, business owners, family offices aged 35-65', 'authoritative but approachable, educational, never promotional', '{SMSF,alternative investments,market commentary,tax strategy,wealth planning}', 'medium', false, false),
  ('rb', 'realbalance.com.au', 'Real Balance Financial is an accounting and advisory firm helping small to medium businesses in Sydney with tax, bookkeeping, and financial strategy.', 'accounting', 'SME business owners, sole traders, startup founders', 'warm, practical, jargon-free, conversational', '{tax tips,bookkeeping,business finance,compliance,growth strategy}', 'medium', false, false);
