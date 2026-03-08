import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the calling user is authenticated and is an owner of the given client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const body = await req.json();
    const { email, client_id } = body;
    if (!email) throw new Error("email is required");
    if (!client_id) throw new Error("client_id is required");

    // Check that caller belongs to this client and has owner-level role
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: callerProfile } = await adminClient
      .from("user_profiles")
      .select("client_id")
      .eq("id", caller.id)
      .single();

    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const callerRole = callerRoles?.[0]?.role;
    const isOwner = callerRole === "client" || callerRole === "business_owner" || callerRole === "admin";

    if (!isOwner) throw new Error("Only owners can invite members");
    if (callerRole !== "admin" && callerProfile?.client_id !== client_id) {
      throw new Error("You can only invite members to your own organisation");
    }

    // Send the invite via Supabase Auth admin API
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        client_id,
        role: "member",
      },
    });

    if (error) throw error;

    return new Response(JSON.stringify({ user_id: data.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
