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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, exam_request_id, search_query, file_category } = await req.json();

    // ── search_studies: lista exames no bucket exam-files ──
    if (action === "search_studies") {
      const { data: exams, error } = await supabase
        .from("exam_requests")
        .select(`
          id, exam_type, status, priority, clinical_info, created_at, file_urls,
          requesting_doctor_id,
          assigned_to
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Optional text filter
      let filtered = exams || [];
      if (search_query) {
        const q = search_query.toLowerCase();
        filtered = filtered.filter((e: any) =>
          e.exam_type?.toLowerCase().includes(q) ||
          e.clinical_info?.toLowerCase().includes(q) ||
          e.id?.toLowerCase().includes(q)
        );
      }

      return new Response(
        JSON.stringify({ studies: filtered, configured: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── get_files: lista arquivos de um exam_request no storage ──
    if (action === "get_files") {
      if (!exam_request_id) {
        return new Response(
          JSON.stringify({ error: "exam_request_id é obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const folder = `exams/${exam_request_id}`;
      const { data: files, error } = await supabase.storage
        .from("exam-files")
        .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const mapped = (files || []).map((f: any) => {
        const filePath = `${folder}/${f.name}`;
        const { data: urlData } = supabase.storage
          .from("exam-files")
          .getPublicUrl(filePath);

        // For private buckets, generate signed URL
        return {
          name: f.name,
          size: f.metadata?.size || 0,
          type: f.metadata?.mimetype || "application/octet-stream",
          created_at: f.created_at,
          path: filePath,
          // We'll generate signed URLs below
        };
      });

      // Generate signed URLs for all files (private bucket)
      const withUrls = await Promise.all(
        mapped.map(async (f: any) => {
          const { data: signedData } = await supabase.storage
            .from("exam-files")
            .createSignedUrl(f.path, 3600); // 1 hour
          return { ...f, url: signedData?.signedUrl || null };
        })
      );

      return new Response(
        JSON.stringify({ files: withUrls }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── upload_file: faz upload de arquivo DICOM/imagem para o exam ──
    if (action === "upload_file") {
      if (!exam_request_id) {
        return new Response(
          JSON.stringify({ error: "exam_request_id é obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // This action expects the file as base64 in the body
      const { file_name, file_base64, content_type } = await req.json().catch(() => ({}));

      if (!file_name || !file_base64) {
        return new Response(
          JSON.stringify({ error: "file_name e file_base64 são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decode base64
      const binaryStr = atob(file_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const filePath = `exams/${exam_request_id}/${file_name}`;
      const { error: uploadError } = await supabase.storage
        .from("exam-files")
        .upload(filePath, bytes, {
          contentType: content_type || "application/dicom",
          upsert: true,
        });

      if (uploadError) {
        return new Response(
          JSON.stringify({ error: uploadError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update exam_request file_urls
      const { data: existing } = await supabase
        .from("exam_requests")
        .select("file_urls")
        .eq("id", exam_request_id)
        .single();

      const currentFiles = (existing?.file_urls as string[]) || [];
      if (!currentFiles.includes(filePath)) {
        await supabase
          .from("exam_requests")
          .update({ file_urls: [...currentFiles, filePath] })
          .eq("id", exam_request_id);
      }

      return new Response(
        JSON.stringify({ success: true, path: filePath }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── delete_file: remove arquivo do storage ──
    if (action === "delete_file") {
      const { file_path } = await req.json().catch(() => ({}));
      if (!file_path) {
        return new Response(
          JSON.stringify({ error: "file_path é obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase.storage
        .from("exam-files")
        .remove([file_path]);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── get_signed_url: gera URL assinada para visualizar arquivo ──
    if (action === "get_signed_url") {
      const { file_path, expires_in } = await req.json().catch(() => ({}));
      if (!file_path) {
        return new Response(
          JSON.stringify({ error: "file_path é obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.storage
        .from("exam-files")
        .createSignedUrl(file_path, expires_in || 3600);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ url: data.signedUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Ação inválida. Use: search_studies, get_files, upload_file, delete_file, get_signed_url",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("PACS integration error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
