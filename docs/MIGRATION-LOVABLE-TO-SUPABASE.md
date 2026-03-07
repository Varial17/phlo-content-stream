# Migrate from Lovable Cloud to Your Own Supabase Project

This guide follows the approach in [How to Migrate from Lovable Cloud to Supabase (Jonathan Perez)](https://www.youtube.com/watch?v=pvPjxmD_0hY). Your app is already configured to use **your** Supabase project; you just need to apply the schema and deploy Edge Functions.

## 1. Confirm your `.env` points to your project

Your project ref: **`jcmazsrpdocstvrlosml`**

`.env` should contain (get values from [Project Settings → API](https://supabase.com/dashboard/project/jcmazsrpdocstvrlosml/settings/api)):

```env
VITE_SUPABASE_PROJECT_ID="jcmazsrpdocstvrlosml"
VITE_SUPABASE_URL="https://jcmazsrpdocstvrlosml.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your anon / public key>"
```

The **Project URL** is `https://jcmazsrpdocstvrlosml.supabase.co` and the **anon public** key goes in `VITE_SUPABASE_PUBLISHABLE_KEY`.

## 2. Get a Supabase access token (for CLI)

1. Open **[Account → Access Tokens](https://supabase.com/dashboard/account/tokens)**.
2. Click **Generate new token**, name it (e.g. "CLI"), copy the token.
3. In your project terminal:

```bash
export SUPABASE_ACCESS_TOKEN="paste-your-token-here"
```

Keep this terminal session open for the next steps (or add the export to your shell profile temporarily).

## 3. Link the Supabase CLI and push migrations

From the project root:

```bash
# Link this repo to your Supabase project
npx supabase link --project-ref jcmazsrpdocstvrlosml

# Apply all migrations (creates tables, RLS, seed data, storage bucket)
npx supabase db push
```

When linking, use the same token from step 2. When you run `db push`, all migrations in `supabase/migrations/` will be applied to your project (clients, posts, ideas, brand_profiles, ai_logs, icps, storage bucket, etc.).

## 4. Deploy Edge Functions (required for AI features)

The app uses these Edge Functions: `ideate`, `generate-post`, `polish-post`, `generate-image`. Deploy them to your project:

```bash
npx supabase functions deploy ideate
npx supabase functions deploy generate-post
npx supabase functions deploy polish-post
npx supabase functions deploy generate-image
```

Each function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; Supabase injects these when deployed, so you don’t set them in `.env` for production.

## 5. Create at least one user and assign roles

After migrations, create a user via [Authentication → Users](https://supabase.com/dashboard/project/jcmazsrpdocstvrlosml/auth/users) (or sign up in the app), then in **SQL Editor** run:

```sql
-- Replace YOUR_USER_UUID with the user's id from auth.users
INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_UUID', 'admin');
```

Now you can sign in and use the app against your own Supabase project.

## 6. Verify

- **Dashboard**: [Table Editor](https://supabase.com/dashboard/project/jcmazsrpdocstvrlosml/editor) — confirm `clients`, `posts`, `ideas`, `brand_profiles`, etc.
- **Storage**: [Storage](https://supabase.com/dashboard/project/jcmazsrpdocstvrlosml/storage/buckets) — bucket `post-images` should exist.
- **App**: From project root run `npm run dev` and sign in; confirm data and features (ideation, generate post, polish, generate image) work.

## Troubleshooting

- **"Access token not provided"**  
  Run `export SUPABASE_ACCESS_TOKEN="..."` (step 2) in the same terminal before `supabase link` / `db push`.

- **"Connection failed" in app**  
  Double-check `.env`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` must match [Project Settings → API](https://supabase.com/dashboard/project/jcmazsrpdocstvrlosml/settings/api) for project `jcmazsrpdocstvrlosml`.

- **Edge Functions 401 / 500**  
  Ensure all four functions are deployed (step 4). For local function testing, set `SUPABASE_SERVICE_ROLE_KEY` in Supabase Dashboard → Edge Functions → secrets (or in local env for `supabase functions serve`).
