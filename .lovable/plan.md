# Phlo Admin Panel — Full Functional Build

This plan adds the AI pipeline, brand profiles, and all missing functional features to make the admin panel fully operational.

## Overview

There are 6 major work areas:

1. **Database changes** — new tables and column additions
2. **New UI components** — TagInput, AIDiffViewer, AILoadingState
3. **Admin Clients page upgrade** — Settings/Brand Profile tabs + Add Client flow
4. **Edge functions** — ideate, generate-post, polish-post (AI pipeline)
5. **Admin All Posts upgrade** — Polish with AI diff viewer
6. **Client Ideation wiring** — connect Refresh Ideas and Generate Post to real edge functions

---

## Phase 1: Database Schema Changes

Create a migration adding:

- `**brand_profiles` table** with all fields from the spec (business context, voice/tone, content strategy, AI generation config). One row per client, unique on `client_id`.
- `**ai_logs` table** for tracking AI API calls (function_name, input/output tokens, success, error).
- **Add columns to `posts**`: `idea_id` (uuid, FK to ideas), `ai_generated` (boolean, default false).
- **Add columns to `ideas**`: `source_url` (text), `source_summary` (text).
- **RLS policies** for brand_profiles (clients can view their own, staff/admin full access) and ai_logs (staff/admin only).
- **Seed brand profile data** for hfg and rb clients.

## Phase 2: Connect Perplexity

Use the Perplexity connector to provide the API key for the ideation edge function. This will be linked to the project automatically.

## Phase 3: New Shared Components

### TagInput Component

A chip-style input for managing arrays (services, content pillars, words to avoid, etc.). Type a value, press Enter to add as a chip, click X to remove.

### AIDiffViewer Component

Side-by-side view showing original text (left) and polished text (right). "Accept" and "Discard" buttons at the bottom. Used in the All Posts edit panel after Polish with AI.

### AILoadingState Component

A pulsing spinner with a contextual message (e.g., "Searching for trends in Australian accounting..." or "Writing in HFG's voice..."). Used during edge function calls.

## Phase 4: Admin Clients Page Upgrade

### Two tabs on the detail panel: "Settings" and "Brand Profile"

**Settings tab** — the existing content (stats, settings table, action buttons), cleaned up.

**Brand Profile tab** — This gose under each client for example i click HFG then i click bradn profile a structured form with 4 sections:

- Section 1: Business Context (website URL, description, industry, target audience, services, location)
- Section 2: Voice and Tone (tone, style notes, writing examples, words to avoid/use)
- Section 3: Content Strategy (pillars, topics to avoid, competitors)
- Section 4: AI Generation Settings (post lengths as radio buttons, emoji/hashtag toggles, CTA style)

Save button upserts to `brand_profiles`. A "Preview AI Voice" button generates a sample post via the generate-post edge function and displays it in a modal.

### Add Client Flow

When "+ Add" is clicked, the detail panel switches to a creation form:

- Step 1: Basic info (firm name, email, staff assignment, channels, plan)
- Step 2: Brand profile fields (can be skipped)
- On submit: insert into `clients` + insert empty `brand_profiles` row

## Phase 5: Edge Functions (AI Pipeline)

### Edge Function 1: `ideate`

- Fetches the client's brand profile
- Calls Perplexity API (via connector) to find current industry news/trends
- Calls Lovable AI (gemini-3-flash-preview) to score each finding and create post hooks
- Inserts results into the `ideas` table
- Logs the call in `ai_logs`

### Edge Function 2: `generate-post`

- Input: idea_id, channel, client_id
- Fetches brand profile + idea details
- Calls Lovable AI with channel-specific instructions and brand voice context
- Creates a new post with status "draft" and ai_generated = true
- Updates the idea status to "drafted"
- Logs in `ai_logs`

### Edge Function 3: `polish-post`

- Input: post_id, client_id
- Fetches brand profile + current post body
- Calls Lovable AI to refine the post to match brand voice
- Returns the polished text (does not auto-save)
- Frontend shows the diff viewer for staff to accept or discard

All three functions use `LOVABLE_API_KEY` (already available) for Lovable AI calls, and `PERPLEXITY_API_KEY` (via connector) for the ideation research step.

## Phase 6: Wire Up All Posts Page

- "Polish with AI" button calls the `polish-post` edge function
- Shows the AILoadingState while processing
- On completion, displays the AIDiffViewer with original vs polished text
- "Accept" saves the polished version to the database
- "Discard" closes the diff viewer

## Phase 7: Wire Up Client Ideation Page

- "Refresh Ideas" button calls the `ideate` edge function with a loading state
- "Generate Post" button calls `generate-post` edge function instead of the current simulated timeout
- Bulk "Generate All Posts" calls `generate-post` for each selected idea sequentially

---

## Technical Details

### Edge Function Config (supabase/config.toml)

```text
[functions.ideate]
verify_jwt = false

[functions.generate-post]
verify_jwt = false

[functions.polish-post]
verify_jwt = false
```

### New Files Created

- `supabase/functions/ideate/index.ts`
- `supabase/functions/generate-post/index.ts`
- `supabase/functions/polish-post/index.ts`
- `src/components/shared/TagInput.tsx`
- `src/components/shared/AIDiffViewer.tsx`
- `src/components/shared/AILoadingState.tsx`
- `src/components/admin/BrandProfileForm.tsx`
- `src/components/admin/AddClientForm.tsx`

### Modified Files

- `src/pages/admin/Clients.tsx` — add tabs, brand profile, add client flow
- `src/pages/admin/AllPosts.tsx` — add polish with AI integration
- `src/pages/client/Ideation.tsx` — wire to real edge functions
- `supabase/config.toml` — add function entries

### AI Model Selection

All AI text generation uses **google/gemini-3-flash-preview** via the Lovable AI gateway (fast, good quality, no extra API key needed). Perplexity **sonar** model is used for the research/news discovery step.