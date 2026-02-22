import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, role, profile_data } = await req.json();

    if (!user_id || !role) {
      return new Response(JSON.stringify({ error: "user_id and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["patient", "doctor", "clinic", "admin", "receptionist", "support", "partner", "affiliate"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin role cannot be self-assigned
    if (role === "admin") {
      return new Response(JSON.stringify({ error: "Cannot self-assign admin role" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert role (ignore conflict if already exists)
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id, role })
      .select()
      .single();

    // If duplicate, that's fine
    if (roleError && !roleError.message.includes("duplicate")) {
      console.error("Role insert error:", roleError);
    }

    // Create profile-specific records if needed
    if (role === "doctor" && profile_data) {
      await supabase.from("doctor_profiles").insert({
        user_id,
        crm: profile_data.crm,
        crm_state: profile_data.crm_state || "SP",
      });
    }

    if (role === "partner" && profile_data) {
      await supabase.from("partner_profiles").insert({
        user_id,
        business_name: profile_data.business_name,
        cnpj: profile_data.cnpj || null,
        partner_type: profile_data.partner_type || "pharmacy",
      });
    }

    if (role === "clinic" && profile_data) {
      await supabase.from("clinic_profiles").insert({
        user_id,
        name: profile_data.name,
        cnpj: profile_data.cnpj || null,
      });
    }

    if (role === "affiliate") {
      await supabase.from("affiliate_profiles").insert({
        user_id,
        pix_key: profile_data?.pix_key || null,
        is_approved: false,
        commission_percent: 2,
      });
    }

    // Mark invite code as used if provided
    if (profile_data?.invite_code_id) {
      await supabase.from("doctor_invite_codes").update({
        is_used: true,
        used_by: user_id,
        used_at: new Date().toISOString(),
      }).eq("id", profile_data.invite_code_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("assign-role error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
