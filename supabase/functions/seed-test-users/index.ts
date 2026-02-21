import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "paciente@teste.com", password: "Teste123!", role: "patient", first_name: "Ana", last_name: "Paciente" },
  { email: "medico@teste.com", password: "Teste123!", role: "doctor", first_name: "Carlos", last_name: "Médico" },
  { email: "clinica@teste.com", password: "Teste123!", role: "clinic", first_name: "Maria", last_name: "Clínica" },
  { email: "recepcao@teste.com", password: "Teste123!", role: "receptionist", first_name: "João", last_name: "Recepção" },
  { email: "suporte@teste.com", password: "Teste123!", role: "support", first_name: "Paula", last_name: "Suporte" },
  { email: "parceiro@teste.com", password: "Teste123!", role: "partner", first_name: "Pedro", last_name: "Parceiro" },
  { email: "afiliado@teste.com", password: "Teste123!", role: "affiliate", first_name: "Lucas", last_name: "Afiliado" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: any[] = [];

    for (const u of TEST_USERS) {
      // Check if user already exists
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find((eu: any) => eu.email === u.email);

      if (found) {
        results.push({ email: u.email, role: u.role, status: "already_exists" });
        continue;
      }

      // Create user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { first_name: u.first_name, last_name: u.last_name },
      });

      if (createError) {
        results.push({ email: u.email, role: u.role, status: "error", error: createError.message });
        continue;
      }

      const userId = newUser.user.id;

      // The handle_new_user trigger will create profile and default 'patient' role.
      // We need to add the specific role if it's not patient.
      if (u.role !== "patient") {
        await supabase.from("user_roles").insert({ user_id: userId, role: u.role });
      }

      // Create role-specific profiles
      if (u.role === "doctor") {
        await supabase.from("doctor_profiles").insert({
          user_id: userId,
          crm: "123456",
          crm_state: "SP",
          bio: "Médico de teste para validação do sistema.",
          consultation_price: 89,
          is_approved: true,
          crm_verified: true,
        });
      }

      if (u.role === "clinic") {
        await supabase.from("clinic_profiles").insert({
          user_id: userId,
          name: "Clínica Teste",
          cnpj: "12.345.678/0001-00",
          phone: "(11) 99999-0000",
          is_approved: true,
        });
      }

      if (u.role === "partner") {
        await supabase.from("partner_profiles").insert({
          user_id: userId,
          business_name: "Farmácia Teste",
          partner_type: "pharmacy",
          cnpj: "98.765.432/0001-00",
          is_approved: true,
        });
      }

      results.push({ email: u.email, password: u.password, role: u.role, status: "created" });
    }

    return new Response(JSON.stringify({ success: true, users: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
