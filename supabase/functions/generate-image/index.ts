import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, post_id } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const imagePrompt = `Generate an image: ${prompt}. Do not respond with text only — you MUST generate and return an image.`;

    const makeRequest = async () => {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429) throw { status: 429, message: "Rate limit exceeded, try again later." };
        if (res.status === 402) throw { status: 402, message: "AI credits exhausted." };
        throw new Error(`AI image generation failed [${res.status}]: ${errText}`);
      }
      return res;
    };

    // Try up to 2 times in case model returns text instead of image
    let aiData: any;
    for (let attempt = 0; attempt < 2; attempt++) {
      const aiRes = await makeRequest();
      aiData = await aiRes.json();
      if (aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url) break;
      if (attempt === 1) throw new Error("AI did not return an image after 2 attempts. Try a more descriptive prompt.");
    }

    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // Upload base64 image to storage
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch?.[1] || "image/png";
    const ext = mimeType.split("/")[1] || "png";

    const bytes = Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0));
    const fileName = `${post_id || crypto.randomUUID()}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, bytes, { contentType: mimeType, upsert: true });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(fileName);

    // If post_id provided, update the post
    if (post_id) {
      await supabase.from("posts").update({ image_url: urlData.publicUrl }).eq("id", post_id);
    }

    return new Response(JSON.stringify({ image_url: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
