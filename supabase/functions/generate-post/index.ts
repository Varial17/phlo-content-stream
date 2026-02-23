import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea_id, channel, client_id, preview } = await req.json();
    if (!client_id) throw new Error("client_id required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { data: profile } = await supabase.from("brand_profiles").select("*").eq("client_id", client_id).single();
    if (!profile) throw new Error("Brand profile not found");

    const { data: client } = await supabase.from("clients").select("name").eq("id", client_id).single();

    let ideaHook = "General industry insight";
    let ideaAngle = "Educational";
    let ideaSummary = "";
    const targetChannel = channel || "linkedin";

    if (idea_id) {
      const { data: idea } = await supabase.from("ideas").select("*").eq("id", idea_id).single();
      if (idea) {
        ideaHook = idea.hook;
        ideaAngle = idea.angle || "Educational";
        ideaSummary = idea.source_summary || "";
      }
    }

    const channelInstructions: Record<string, string> = {
      linkedin: `LinkedIn post. ${profile.post_length_linkedin === "short" ? "100-150 words" : profile.post_length_linkedin === "long" ? "250-400 words" : "150-250 words"}.
Structure: strong hook line → 3-5 short paragraphs → soft CTA or question.
No em-dashes. Short sentences. Line breaks between paragraphs.
${profile.use_hashtags ? "Add 3-5 relevant hashtags at the end." : "No hashtags."}
${profile.use_emojis ? "Use emojis sparingly." : "No emojis."}`,
      threads: `Threads post. Under 100 words. Punchy, conversational, one clear idea.`,
      email: `Email newsletter section. 200-300 words. Subject line + body. Professional but warm.`,
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "user",
          content: `You are writing content for ${client?.name || client_id}.

BRAND VOICE:
${profile.tone_of_voice || "Professional and clear"}

WRITING STYLE:
${profile.writing_style_notes || "Clear, direct, no jargon"}

WORDS TO AVOID:
${(profile.words_to_avoid as string[])?.join(", ") || "none specified"}

AUDIENCE:
${profile.target_audience || "General professional audience"}

${profile.writing_examples ? `WRITING EXAMPLES (match this style):\n${profile.writing_examples}` : ""}

TASK:
Write a ${targetChannel} post based on this idea:
- Hook: ${ideaHook}
- Angle: ${ideaAngle}
- Context: ${ideaSummary || "General industry topic"}

FORMAT INSTRUCTIONS:
${channelInstructions[targetChannel] || channelInstructions.linkedin}

Write the post only. No explanations, no "here's your post:", just the post content.`
        }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${aiRes.status}: ${errText}`);
    }

    const aiData = await aiRes.json();
    const body = aiData.choices?.[0]?.message?.content ?? "";

    // Log
    await supabase.from("ai_logs").insert({
      client_id,
      function_name: "generate",
      success: true,
      input_tokens: aiData.usage?.prompt_tokens ?? 0,
      output_tokens: aiData.usage?.completion_tokens ?? 0,
    });

    if (preview) {
      return new Response(JSON.stringify({ body }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Extract hook from first line
    const lines = body.split("\n").filter((l: string) => l.trim());
    const hook = lines[0]?.slice(0, 100) || ideaHook;

    const { data: post, error: postErr } = await supabase.from("posts").insert({
      client_id,
      channel: targetChannel,
      hook,
      body,
      status: "draft",
      ai_generated: true,
      idea_id: idea_id || null,
    }).select("id").single();
    if (postErr) throw postErr;

    if (idea_id) {
      await supabase.from("ideas").update({ status: "drafted" }).eq("id", idea_id);
    }

    return new Response(JSON.stringify({ post_id: post.id, body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
