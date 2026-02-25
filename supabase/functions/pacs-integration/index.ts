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
    const ORTHANC_URL = Deno.env.get("ORTHANC_URL");
    const ORTHANC_USERNAME = Deno.env.get("ORTHANC_USERNAME") || "orthanc";
    const ORTHANC_PASSWORD = Deno.env.get("ORTHANC_PASSWORD") || "orthanc";

    if (!ORTHANC_URL) {
      return new Response(
        JSON.stringify({
          error: "PACS (Orthanc) não configurado. Adicione ORTHANC_URL nas secrets.",
          configured: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = "Basic " + btoa(`${ORTHANC_USERNAME}:${ORTHANC_PASSWORD}`);

    const { action, study_id, series_id, patient_name, modality, date_from, date_to, exam_request_id } =
      await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "search_studies") {
      // DICOMweb QIDO-RS: Search for studies
      const params = new URLSearchParams();
      if (patient_name) params.set("PatientName", patient_name);
      if (modality) params.set("ModalitiesInStudy", modality);
      if (date_from && date_to) params.set("StudyDate", `${date_from}-${date_to}`);

      const res = await fetch(
        `${ORTHANC_URL}/dicom-web/studies?${params.toString()}`,
        {
          headers: {
            Authorization: authHeader,
            Accept: "application/dicom+json",
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return new Response(
          JSON.stringify({ error: `Erro ao buscar estudos PACS: ${res.status}`, details: text }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const studies = await res.json();

      // Map DICOM JSON to friendly format
      const mapped = studies.map((s: any) => ({
        study_uid: s["0020000D"]?.Value?.[0] || "",
        patient_name: s["00100010"]?.Value?.[0]?.Alphabetic || "",
        patient_id: s["00100020"]?.Value?.[0] || "",
        study_date: s["00080020"]?.Value?.[0] || "",
        study_description: s["00081030"]?.Value?.[0] || "",
        modality: s["00080061"]?.Value?.[0] || "",
        accession_number: s["00080050"]?.Value?.[0] || "",
        num_series: s["00201206"]?.Value?.[0] || 0,
        num_instances: s["00201208"]?.Value?.[0] || 0,
      }));

      return new Response(
        JSON.stringify({ studies: mapped }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_series") {
      // Get series list for a study
      if (!study_id) {
        return new Response(
          JSON.stringify({ error: "study_id é obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(
        `${ORTHANC_URL}/dicom-web/studies/${study_id}/series`,
        {
          headers: {
            Authorization: authHeader,
            Accept: "application/dicom+json",
          },
        }
      );

      const series = await res.json();
      const mapped = series.map((s: any) => ({
        series_uid: s["0020000E"]?.Value?.[0] || "",
        modality: s["00080060"]?.Value?.[0] || "",
        description: s["0008103E"]?.Value?.[0] || "",
        num_instances: s["00201209"]?.Value?.[0] || 0,
      }));

      return new Response(
        JSON.stringify({ series: mapped }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_instances") {
      // Get WADO-RS URLs for instances in a series
      if (!study_id || !series_id) {
        return new Response(
          JSON.stringify({ error: "study_id e series_id são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(
        `${ORTHANC_URL}/dicom-web/studies/${study_id}/series/${series_id}/instances`,
        {
          headers: {
            Authorization: authHeader,
            Accept: "application/dicom+json",
          },
        }
      );

      const instances = await res.json();
      const mapped = instances.map((inst: any) => {
        const sopUid = inst["00080018"]?.Value?.[0] || "";
        return {
          sop_instance_uid: sopUid,
          instance_number: inst["00200013"]?.Value?.[0] || 0,
          wado_url: `${ORTHANC_URL}/dicom-web/studies/${study_id}/series/${series_id}/instances/${sopUid}`,
          rendered_url: `${ORTHANC_URL}/dicom-web/studies/${study_id}/series/${series_id}/instances/${sopUid}/rendered`,
        };
      });

      return new Response(
        JSON.stringify({ instances: mapped }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "import_to_exam") {
      // Import a PACS study as files for an exam_request
      if (!study_id || !exam_request_id) {
        return new Response(
          JSON.stringify({ error: "study_id e exam_request_id são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get rendered images from the study
      const seriesRes = await fetch(
        `${ORTHANC_URL}/dicom-web/studies/${study_id}/series`,
        { headers: { Authorization: authHeader, Accept: "application/dicom+json" } }
      );
      const seriesList = await seriesRes.json();

      const importedFiles: string[] = [];

      for (const s of seriesList.slice(0, 5)) {
        const seriesUid = s["0020000E"]?.Value?.[0];
        if (!seriesUid) continue;

        // Get rendered image (PNG) for first instance
        const instancesRes = await fetch(
          `${ORTHANC_URL}/dicom-web/studies/${study_id}/series/${seriesUid}/instances`,
          { headers: { Authorization: authHeader, Accept: "application/dicom+json" } }
        );
        const instancesList = await instancesRes.json();

        for (const inst of instancesList.slice(0, 3)) {
          const sopUid = inst["00080018"]?.Value?.[0];
          if (!sopUid) continue;

          const renderedRes = await fetch(
            `${ORTHANC_URL}/dicom-web/studies/${study_id}/series/${seriesUid}/instances/${sopUid}/rendered`,
            { headers: { Authorization: authHeader, Accept: "image/png" } }
          );

          if (renderedRes.ok) {
            const imageBlob = await renderedRes.blob();
            const filePath = `exams/${exam_request_id}/${seriesUid}_${sopUid}.png`;

            const { error: uploadError } = await supabase.storage
              .from("exam-files")
              .upload(filePath, imageBlob, { contentType: "image/png" });

            if (!uploadError) {
              importedFiles.push(filePath);
            }
          }
        }
      }

      // Update exam_request with imported files
      if (importedFiles.length > 0) {
        const { data: existingReq } = await supabase
          .from("exam_requests")
          .select("file_urls")
          .eq("id", exam_request_id)
          .single();

        const currentFiles = (existingReq?.file_urls as string[]) || [];
        await supabase
          .from("exam_requests")
          .update({ file_urls: [...currentFiles, ...importedFiles] })
          .eq("id", exam_request_id);
      }

      return new Response(
        JSON.stringify({ success: true, imported_files: importedFiles.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use: search_studies, get_series, get_instances, import_to_exam" }),
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
