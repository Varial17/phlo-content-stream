import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "user",
          content: `You are editing a ${post.channel} post for ${client?.name || client_id}.

BRAND VOICE: ${profile.tone_of_voice || "Professional"}
AUDIENCE: ${profile.target_audience || "General"}
WORDS TO AVOID: ${(profile.words_to_avoid as string[])?.join(", ") || "none"}
${profile.writing_examples ? `STYLE REFERENCE:\n${profile.writing_examples}` : ""}

ORIGINAL DRAFT:
${post.body}

TASK: Polish this post. Fix the flow, sharpen the hook, tighten the language, and make sure it sounds like ${client?.name || "the brand"}'s voice.
Keep the same core message and length. Do not change the facts.

Return the polished post only. No commentary.`
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
