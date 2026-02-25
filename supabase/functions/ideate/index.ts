import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client_id } = await req.json();
    if (!client_id) throw new Error("client_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch brand profile
    const { data: profile, error: profileErr } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("client_id", client_id)
      .single();
    if (profileErr || !profile) throw new Error("Brand profile not found for " + client_id);

    const { data: client } = await supabase.from("clients").select("name, channels").eq("id", client_id).single();

    // Call Perplexity
    const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{
          role: "user",
          content: `Find 10 recent news items, regulatory changes, or trending topics relevant to a ${profile.industry} firm in Australia targeting ${profile.target_audience}.
          
Focus on: ${(profile.content_pillars as string[])?.join(", ") || "general industry news"}

For each item return:
- headline (the news/trend)
- why_relevant (1 sentence)
- source_url
- suggested_angle (Educational/Opinion/Case Study/Trending/Story)

Return as JSON array only, no preamble.`
        }],
      }),
    });

    const perplexityData = await perplexityRes.json();
    if (!perplexityRes.ok) throw new Error(`Perplexity error: ${JSON.stringify(perplexityData)}`);

    const rawContent = perplexityData.choices?.[0]?.message?.content ?? "[]";

    // Call Lovable AI to score and create hooks
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "user",
          content: `You are a content strategist for ${client?.name || client_id}, a ${profile.industry} firm.

Brand context:
- Target audience: ${profile.target_audience}
- Tone: ${profile.tone_of_voice}
- Content pillars: ${(profile.content_pillars as string[])?.join(", ") || "general"}
- Topics to avoid: ${(profile.topics_to_avoid as string[])?.join(", ") || "none"}

Here are research findings:
${rawContent}

For each item, create a LinkedIn post hook (first line only, max 15 words, should stop the scroll) and score its relevance 1-10 for this specific audience.

Return as JSON array: { hook, angle, relevance, source_url, source_summary }
No preamble, JSON only.`
        }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error ${aiRes.status}: ${errText}`);
    }

    const aiData = await aiRes.json();
    const aiContent = aiData.choices?.[0]?.message?.content ?? "[]";

    // Parse ideas
    let ideas: any[] = [];
    try {
      const cleaned = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      ideas = JSON.parse(cleaned);
    } catch { ideas = []; }

    const channels = (client?.channels as string[]) ?? ["linkedin"];

    // Insert ideas
    const rows = ideas.map((idea: any) => ({
      client_id,
      hook: idea.hook || "Untitled idea",
      angle: idea.angle || "Educational",
      channel: channels,
      relevance: Math.min(10, Math.max(1, Number(idea.relevance) || 5)),
      source_url: idea.source_url || null,
      source_summary: idea.source_summary || null,
      status: "new",
    }));

    if (rows.length > 0) {
      const { error: insertErr } = await supabase.from("ideas").insert(rows);
      if (insertErr) throw insertErr;
    }

    // Log
    await supabase.from("ai_logs").insert({
      client_id,
      function_name: "ideate",
      success: true,
      input_tokens: aiData.usage?.prompt_tokens ?? 0,
      output_tokens: aiData.usage?.completion_tokens ?? 0,
    });

    return new Response(JSON.stringify({ count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ideate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
