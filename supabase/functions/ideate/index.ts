import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Model config — swap here to change either model independently ────────────
const RESEARCH_MODEL = "sonar";              // Perplexity: fast live web search (~4s)
const STRUCTURE_MODEL = "claude-haiku-4-5-20251001"; // Fast JSON structuring — swap to claude-sonnet-4-6 for richer output // Claude: hooks, framing, editorial structure
// ─────────────────────────────────────────────────────────────────────────────

async function fetchResearch(perplexityKey: string, prompt: string) {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + perplexityKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: RESEARCH_MODEL,
      messages: [{ role: "user", content: prompt }],
      return_citations: true,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error("Perplexity error " + res.status + ": " + errText.slice(0, 300));
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    citations: (data.citations ?? []).slice(0, 8),
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

async function structureIdeas(anthropicKey: string, rawResearch: string, citations: string[], clientContext: { name: string; industry: string; location: string; icpNames: string }) {
  const citationBlock = citations.length > 0 ? "\nSource URLs:\n" + citations.join("\n") : "";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: STRUCTURE_MODEL,
      max_tokens: 2500,
      messages: [{
        role: "user",
        content: "Content strategist for " + clientContext.name + " (" + clientContext.industry + "). Audiences: " + clientContext.icpNames + ".\n\n" +
          "Research:\n" + rawResearch + citationBlock + "\n\n" +
          "Create 6 content ideas from this research. Return a JSON array of 6 objects, each with:\n" +
          "hook (string, max 15 words, bold statement not question), " +
          "angle (Insight|Case Study|List|Market Commentary|Opinion), " +
          "channel (string[], from [linkedin,email,threads]), " +
          "target_icp (string, one of: " + clientContext.icpNames + "), " +
          "relevance (number 1-10), " +
          "treatment (string, 2 sentences on how to write it), " +
          "why_this_post (string, 1 sentence why it matters now), " +
          "research_findings (string, 2-3 sentences with specific data), " +
          "key_facts (string[], 3 bullet facts), " +
          "source_url (string|null), " +
          "source_summary (string, 1 sentence).\n\n" +
          "Raw JSON array only. No markdown, no preamble.",
      }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error("Anthropic error " + res.status + ": " + errText.slice(0, 300));
  }
  const data = await res.json();
  return {
    content: (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text || "").join(""),
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!perplexityKey) {
    return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not set. Add it in Supabase Dashboard → Edge Functions → Secrets." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set. Add it in Supabase Dashboard → Edge Functions → Secrets." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let supabase: any;
  let clientId: string | undefined;

  try {
    supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    clientId = body.client_id;
    if (!clientId) throw new Error("client_id is required");

    const [{ data: profile }, { data: icps }] = await Promise.all([
      supabase.from("brand_profiles").select("*").eq("client_id", clientId).single(),
      supabase.from("icps").select("*").eq("client_id", clientId),
    ]);
    if (!profile) throw new Error("Brand profile not found for " + clientId);

    const icpNames = (icps || []).map((icp) => icp.name).join(", ");
    const pillars = (profile.content_pillars || []).join(", ") || "financial services";
    const toAvoid = (profile.topics_to_avoid || []).join(", ") || "none";
    const clientContext = {
      name: profile.business_description || clientId,
      industry: profile.industry || "financial services",
      location: profile.location || "Australia",
      icpNames: icpNames || profile.target_audience || "financial professionals",
    };

    // Step 1: Perplexity live research (~4s)
    const { content: rawResearch, citations, inputTokens: pxIn, outputTokens: pxOut } =
      await fetchResearch(perplexityKey,
        "Find 8 specific recent news items from the last 3 weeks relevant to " + clientContext.name + ", a " + clientContext.industry + " firm in " + clientContext.location + ". " +
        "Focus: " + pillars + ". Audiences: " + clientContext.icpNames + ". Avoid: " + toAvoid + ". " +
        "For each: headline, key data point or figure, why it matters, source URL. " +
        "Focus on Australian financial services, lending, property, credit, APRA/RBA, and investment news. Include specific dates and numbers."
      );

    // Step 2: Claude structures research into idea objects (~20s)
    const { content: structuredText, inputTokens: claudeIn, outputTokens: claudeOut } =
      await structureIdeas(anthropicKey, rawResearch, citations, clientContext);

    // Parse
    let ideas = [];
    try {
      const cleaned = structuredText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      ideas = JSON.parse(match ? match[0] : cleaned);
    } catch {
      console.error("JSON parse failed:", structuredText.slice(0, 500));
      throw new Error("Failed to parse Claude response as JSON");
    }
    if (!Array.isArray(ideas) || ideas.length === 0) throw new Error("No ideas returned");

    // Map to columns that exist on public.ideas (no target_icp, treatment, why_this_post, research_findings, key_facts)
    const rows = ideas.map((idea) => ({
      client_id: clientId,
      hook: String(idea.hook || "Untitled idea").slice(0, 280),
      angle: String(idea.angle || "Insight"),
      channel: Array.isArray(idea.channel) ? idea.channel : ["linkedin"],
      relevance: Math.min(10, Math.max(1, Number(idea.relevance) || 5)),
      source_url: idea.source_url ? String(idea.source_url) : null,
      source_summary: idea.source_summary ? String(idea.source_summary) : null,
      status: "new",
    }));

    const { error: insertErr } = await supabase.from("ideas").insert(rows);
    if (insertErr) throw insertErr;

    await supabase.from("ai_logs").insert({
      client_id: clientId,
      function_name: "ideate",
      input_tokens: pxIn + claudeIn,
      output_tokens: pxOut + claudeOut,
      success: true,
    });

    return new Response(JSON.stringify({ count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("ideate error:", msg);
    if (supabase) {
      await supabase.from("ai_logs").insert({
        client_id: clientId || null, function_name: "ideate", success: false, error_message: msg,
      }).then(() => {}).catch(() => {});
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
