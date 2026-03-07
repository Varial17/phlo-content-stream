import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Skill files are read from the skills/ folder in the repo ──────────────
// They are stored as Supabase Storage objects under the bucket "skills"
// Upload path matches the repo structure: e.g. "brand-profile/SKILL.md"
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_LOAD_ORDER = [
  "brand-profile/SKILL.md",
  "icp-profiles/SKILL.md",
  "writing-style/SKILL.md",
  "content-generation/SKILL.md",
];

async function readSkill(supabase: any, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("skills")
    .download(path);

  if (error) {
    console.warn(`Skill not found: ${path} — skipping`);
    return "";
  }

  return await data.text();
}

async function buildSystemPrompt(
  supabase: any,
  brandProfile: any,
  icps: any[]
): Promise<string> {
  const sections: string[] = [];

  // ── 1. App context ────────────────────────────────────────────────────────
  sections.push(`# System Context
You are the AI writing engine for Phlo, a content management platform for financial services firms.
Your job is to write high-quality, publication-ready content for the client described below.
Follow every instruction in the skill files precisely. Do not summarise or skip rules.`);

  // ── 2. Load skills in order ───────────────────────────────────────────────
  for (const skillPath of SKILL_LOAD_ORDER) {
    const content = await readSkill(supabase, skillPath);
    if (content) {
      sections.push(`\n---\n${content}`);
    }
  }

  // ── 3. Inject live client data from Supabase ──────────────────────────────
  if (brandProfile) {
    sections.push(`
---
# Live Client Brand Data (from database — use this for all client-specific details)

**Client:** ${brandProfile.business_description ?? "Not set"}
**Industry:** ${brandProfile.industry ?? "Financial services"}
**Location:** ${brandProfile.location ?? "Australia"}
**Website:** ${brandProfile.website_url ?? "Not provided"}
**Tone of voice:** ${brandProfile.tone_of_voice ?? "Professional, authoritative"}
**Content pillars:** ${(brandProfile.content_pillars as string[] | null)?.join(", ") ?? "Not set"}
**Target audience:** ${brandProfile.target_audience ?? "Financial services professionals"}
**Services:** ${(brandProfile.services as string[] | null)?.join(", ") ?? "Not set"}
**Words to USE:** ${(brandProfile.words_to_use as string[] | null)?.join(", ") ?? "None specified"}
**Words to AVOID:** ${(brandProfile.words_to_avoid as string[] | null)?.join(", ") ?? "None specified"}
**Topics to AVOID:** ${(brandProfile.topics_to_avoid as string[] | null)?.join(", ") ?? "None specified"}
**CTA style:** ${brandProfile.cta_style ?? "No direct CTA — end with insight"}
**Use emojis:** ${brandProfile.use_emojis ? "Yes, sparingly" : "No"}
**Use hashtags:** ${brandProfile.use_hashtags ? "Yes, 2-3 relevant ones" : "No"}
**LinkedIn post length preference:** ${brandProfile.post_length_linkedin ?? "150-280 words"}
**Writing style notes:** ${brandProfile.writing_style_notes ?? "Not set"}
${brandProfile.writing_examples ? `**Writing examples (match this style):**\n${brandProfile.writing_examples}` : ""}`);
  }

  // ── 4. Inject ICP data ────────────────────────────────────────────────────
  if (icps && icps.length > 0) {
    const icpSection = icps.map((icp) => `
### ICP: ${icp.name}
- **Description:** ${icp.description ?? "Not set"}
- **Decision makers:** ${icp.decision_makers ?? "Not set"}
- **Pain points:** ${icp.pain_points ?? "Not set"}
- **Motivations:** ${icp.motivations ?? "Not set"}
- **Content goal:** ${icp.content_goal ?? "Not set"}
- **Content pillars:** ${(icp.content_pillars as string[] | null)?.join(", ") ?? "Not set"}
- **Tone for this ICP:** ${icp.tone ?? "Match brand tone"}`).join("\n");

    sections.push(`
---
# Live ICP Data (from database)

${icpSection}`);
  }

  return sections.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!anthropicKey) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY is not set. Add it in Supabase Dashboard → Project Settings → Edge Functions → Secrets (name must be exactly ANTHROPIC_API_KEY).",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Supabase env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) missing." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  let clientId: string | undefined;
  let functionStartTime = Date.now();

  try {
    const body = await req.json();
    const { idea_id, channel, client_id, custom_brief } = body;

    clientId = client_id;

    if (!client_id) throw new Error("client_id is required");
    if (!channel) throw new Error("channel is required");

    // ── Fetch client data ──────────────────────────────────────────────────
    const [{ data: brandProfile }, { data: icps }, { data: idea }] = await Promise.all([
      supabase.from("brand_profiles").select("*").eq("client_id", client_id).single(),
      supabase.from("icps").select("*").eq("client_id", client_id),
      idea_id
        ? supabase.from("ideas").select("*").eq("id", idea_id).single()
        : Promise.resolve({ data: null }),
    ]);

    // ── Build system prompt from skills + client data ─────────────────────
    const systemPrompt = await buildSystemPrompt(supabase, brandProfile, icps ?? []);

    // ── Build the user message ────────────────────────────────────────────
    const channelLabel = channel === "linkedin"
      ? "LinkedIn post"
      : channel === "email"
      ? "email newsletter article"
      : "Threads post";

    let userMessage = "";

    if (idea) {
      userMessage = `Write a ${channelLabel} based on the following idea:

**Hook / Angle:** ${idea.hook}
${idea.angle ? `**Content angle:** ${idea.angle}` : ""}
${idea.source_summary ? `**Source context:** ${idea.source_summary}` : ""}
${idea.source_url ? `**Source:** ${idea.source_url}` : ""}

Apply the brand profile, ICP context, writing style rules, and content generation templates from the skill files above. Produce the complete, publication-ready post body.

Return ONLY the post body text. No preamble, no "here is your post", no metadata. Just the content itself, ready to publish.`;
    } else if (custom_brief) {
      userMessage = `Write a ${channelLabel} based on this brief:

${custom_brief}

Apply the brand profile, ICP context, writing style rules, and content generation templates from the skill files above. Produce the complete, publication-ready post body.

Return ONLY the post body text. No preamble, no metadata. Just the content itself, ready to publish.`;
    } else {
      throw new Error("Either idea_id or custom_brief is required");
    }

    // ── Call Claude API ───────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const generatedBody = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("");

    // Extract hook from first non-empty line
    const firstLine = generatedBody
      .split("\n")
      .find((l: string) => l.trim())
      ?.trim()
      ?.slice(0, 120) ?? "Generated post";

    // ── Save as draft post ────────────────────────────────────────────────
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        client_id,
        channel,
        hook: idea?.hook ?? firstLine,
        body: generatedBody,
        status: "draft",
        ai_generated: true,
        idea_id: idea_id ?? null,
      })
      .select()
      .single();

    if (postError) throw postError;

    // Update idea status to "drafted" if we used one
    if (idea_id) {
      await supabase
        .from("ideas")
        .update({ status: "drafted" })
        .eq("id", idea_id);
    }

    // ── Log success ───────────────────────────────────────────────────────
    await supabase.from("ai_logs").insert({
      client_id,
      function_name: "generate-post",
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      success: true,
    });

    return new Response(
      JSON.stringify({ post_id: post.id, body: generatedBody, hook: post.hook }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[generate-post]", error?.message ?? error);
    // ── Log failure ───────────────────────────────────────────────────────
    await supabase.from("ai_logs").insert({
      client_id: clientId ?? null,
      function_name: "generate-post",
      success: false,
      error_message: error.message,
    }).catch(() => {}); // don't throw if logging fails

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
