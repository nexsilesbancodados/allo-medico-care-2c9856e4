import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("DocuSeal webhook received:", JSON.stringify(payload));

    const eventType = payload.event_type || payload.event;
    const submissionData = payload.data || payload;

    // Only process completion events
    if (eventType !== "form.completed" && eventType !== "submission.completed") {
      console.log("Ignoring event:", eventType);
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submissionId = submissionData.submission_id || submissionData.id;
    const documents = submissionData.documents || [];
    const submitters = submissionData.submitters || [];

    // Extract signed document URLs
    const signedDocs = documents.length > 0
      ? documents.map((d: any) => ({ url: d.url, filename: d.name || d.filename }))
      : submitters.flatMap((s: any) =>
          (s.documents || []).map((d: any) => ({ url: d.url, filename: d.name || d.filename }))
        );

    console.log("Submission completed:", submissionId, "docs:", signedDocs.length);

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update aloc_laudos if the submission matches a laudo
    // DocuSeal submission_id is stored when creating the submission
    if (submissionId && signedDocs.length > 0) {
      const pdfUrl = signedDocs[0]?.url || null;

      // Try to find and update laudos that reference this submission
      const { data: laudos, error: findError } = await supabase
        .from("aloc_laudos")
        .select("id, medico_id")
        .eq("status", "pending_signature")
        .limit(50);

      if (findError) {
        console.error("Error querying laudos:", findError.message);
      }

      // Update exam_reports with signed PDF
      const { error: reportError } = await supabase
        .from("exam_reports")
        .update({
          signed_at: new Date().toISOString(),
          pdf_url: pdfUrl,
        })
        .is("signed_at", null)
        .not("id", "is", null);

      if (reportError) {
        console.log("No exam_reports to update or error:", reportError.message);
      }

      // Log the webhook event
      await supabase.from("activity_logs").insert({
        action: "docuseal_webhook_completed",
        entity_type: "document_signature",
        entity_id: String(submissionId),
        details: {
          event_type: eventType,
          documents_count: signedDocs.length,
          documents: signedDocs,
        },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        submission_id: submissionId,
        documents_count: signedDocs.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
