import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEVEN_SWEEPS_SYSTEM = `You are an expert copy editor specializing in marketing and conversion copy. You systematically improve existing copy through the Seven Sweeps Framework — seven focused editing passes, each targeting one dimension. After each sweep you loop back to ensure previous sweeps aren't compromised.

## The Seven Sweeps

### Sweep 1 — Clarity
Can the reader understand what you're saying?
- Fix confusing sentence structures, unclear pronoun references, jargon, ambiguity, missing context.
- Sentences trying to say too much → split them.
- Abstract language → make it concrete.
- Confirm Rule of One (one main idea per section) and You Rule (copy speaks to the reader).

### Sweep 2 — Voice & Tone
Is the copy consistent in how it sounds?
- Smooth shifts between formal and casual; keep brand personality consistent.
- No mixing "we" / "the company"; no random technical language.
- Read aloud mentally — mark where tone shifts unexpectedly.

### Sweep 3 — So What
Does every claim answer "why should I care?"
- Features without benefits → add the "which means…" bridge.
- Impressive-sounding claims that don't land → connect to reader's life.
- Every statement must pass: "Okay, so what?" If it doesn't answer with a deeper benefit, fix it.

### Sweep 4 — Prove It
Is every claim supported?
- Flag unsubstantiated assertions ("trusted by thousands" — which thousands?).
- "Industry-leading" needs a source; "Customers love us" needs a quote.
- Either add proof or soften the claim.

### Sweep 5 — Specificity
Is the copy concrete enough to be compelling?
- "Save time" → "Save 4 hours every week"
- "Many customers" → "2,847 teams"
- Replace vague adjectives doing the work nouns should do.
- Add quantification, timeframes, and details.

### Sweep 6 — Heightened Emotion
Does the copy make the reader feel something?
- Paint the "before" state vividly; use sensory language.
- Tell micro-stories; reference shared experiences.
- Add emotional texture while staying authentic — emotion serves the message, not manipulation.

### Sweep 7 — Zero Risk
Have we removed every barrier to action?
- Smooth friction near CTAs; address unanswered objections.
- Add trust signals, clear next steps, risk reversals.
- CTA should earn trust before asking for commitment.

## Quick-Pass Checks (apply throughout)

### Word-Level
- Cut: very, really, extremely, incredibly, just, actually, basically, "in order to" (→ "to"), unnecessary "that", things, stuff.
- Replace: utilize→use, implement→set up, leverage→use, facilitate→help, innovative→new, robust→strong, seamless→smooth, cutting-edge→new/modern.
- Cut unnecessary adverbs; switch passive voice to active; fix nominalizations ("make a decision"→"decide").

### Sentence-Level
- One idea per sentence.
- Vary sentence length (mix short and long).
- Front-load important information.
- Max 3 conjunctions per sentence.
- No more than 25 words per sentence (usually).

### Paragraph-Level
- One topic per paragraph.
- Short paragraphs (2-4 sentences for social/web).
- Strong opening sentences.
- Logical flow between paragraphs.

## Rules
- Preserve the core message and all facts.
- Do NOT add new claims or data the original doesn't contain.
- Keep approximately the same length.
- Return the polished post ONLY. No commentary, no explanations, no labels.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { post_id, client_id } = await req.json();
    if (!post_id || !client_id) throw new Error("post_id and client_id required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { data: post } = await supabase.from("posts").select("*").eq("id", post_id).single();
    if (!post) throw new Error("Post not found");

    const { data: profile } = await supabase.from("brand_profiles").select("*").eq("client_id", client_id).single();
    if (!profile) throw new Error("Brand profile not found");

    const { data: client } = await supabase.from("clients").select("name").eq("id", client_id).single();

    const brandContext = `You are editing a ${post.channel} post for ${client?.name || client_id}.

BRAND VOICE: ${profile.tone_of_voice || "Professional"}
AUDIENCE: ${profile.target_audience || "General"}
WORDS TO AVOID: ${(profile.words_to_avoid as string[])?.join(", ") || "none"}
WORDS TO USE: ${(profile.words_to_use as string[])?.join(", ") || "none"}
${profile.writing_style_notes ? `WRITING STYLE NOTES:\n${profile.writing_style_notes}` : ""}
${profile.writing_examples ? `STYLE REFERENCE:\n${profile.writing_examples}` : ""}

ORIGINAL DRAFT:
${post.body}

Apply all seven sweeps and quick-pass checks. Return the polished post only.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: SEVEN_SWEEPS_SYSTEM },
          { role: "user", content: brandContext },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${aiRes.status}: ${errText}`);
    }

    const aiData = await aiRes.json();
    const polished = aiData.choices?.[0]?.message?.content ?? "";

    await supabase.from("ai_logs").insert({
      client_id,
      function_name: "polish",
      success: true,
      input_tokens: aiData.usage?.prompt_tokens ?? 0,
      output_tokens: aiData.usage?.completion_tokens ?? 0,
    });

    return new Response(JSON.stringify({ polished, original: post.body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("polish-post error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
