
# Upgrade Polish with AI to use Seven Sweeps Framework

## What Changes

The "Polish with AI" button on All Posts will use the full Seven Sweeps copyediting methodology instead of a simple "polish this" prompt. This produces significantly higher quality edits.

## Model

Since Claude Opus 4.6 is not available on the AI gateway, this plan uses **google/gemini-3-pro-preview** (the most capable available model) to handle the multi-pass reasoning the framework requires.

## How It Works

The edge function `polish-post` will be updated with a detailed system prompt that instructs the AI to run all seven sweeps internally and return the final polished result:

1. **Clarity** -- fix confusing structures, jargon, ambiguity
2. **Voice and Tone** -- match brand voice consistently throughout
3. **So What** -- ensure every claim answers "why should I care?"
4. **Prove It** -- flag or soften unsubstantiated claims
5. **Specificity** -- replace vague language with concrete details
6. **Heightened Emotion** -- add authentic emotional texture
7. **Zero Risk** -- smooth friction near any call-to-action

The prompt also includes the word-level and sentence-level quick checks (cut filler words, replace corporate speak, vary sentence length, front-load key info).

## Technical Details

### File Modified

- `supabase/functions/polish-post/index.ts`

### Changes

1. Switch model from `google/gemini-3-flash-preview` to `google/gemini-3-pro-preview`
2. Replace the simple polish prompt with the full Seven Sweeps system prompt that includes:
   - The framework overview and all 7 sweep descriptions
   - Word-level replacements (utilize to use, leverage to use, etc.)
   - Sentence-level rules (one idea per sentence, max 25 words, vary length)
   - Brand context injection (tone, audience, words to avoid, writing examples) as before
   - Instructions to preserve core message and facts, return polished text only
3. No frontend changes needed -- the diff viewer already shows original vs polished

### Prompt Structure

The AI receives:
- A system message with the full Seven Sweeps methodology and quick-pass checks
- A user message with the brand profile context + the post body to edit

This gives the model enough context to apply all seven passes internally and return a single polished result.
