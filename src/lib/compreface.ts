/**
 * CompreFace integration for face verification and detection.
 * Uses a self-hosted CompreFace instance.
 */

const COMPREFACE_URL = "http://72.62.138.208:8000";
const VERIFY_API_KEY = "5f3c100e-0144-465d-87b3-86c34ba70a1e";
const DETECT_API_KEY = "a2d930ec-e3ee-46b4-b770-023524e41178";

export interface VerificacaoResult {
  aprovado: boolean;
  similarity: number;
}

export interface DeteccaoResult {
  faceDetected: boolean;
  facesCount: number;
}

/**
 * Verifica se o rosto da selfie corresponde ao rosto no documento.
 * Usa o serviço de Verification do CompreFace.
 */
export async function verificarFace(
  selfie: File,
  fotoDoc: File
): Promise<VerificacaoResult> {
  const formData = new FormData();
  formData.append("source_image", selfie);
  formData.append("target_image", fotoDoc);

  const res = await fetch(`${COMPREFACE_URL}/api/v1/verification/verify`, {
    method: "POST",
    headers: {
      "x-api-key": VERIFY_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CompreFace verify error ${res.status}: ${text}`);
  }

  const data = await res.json();

  // CompreFace returns result array with similarity scores
  const results = data?.result ?? [];
  const bestMatch = results[0];
  const similarity = bestMatch?.face_matches?.[0]?.similarity ?? 0;

  return {
    aprovado: similarity >= 0.85,
    similarity: Math.round(similarity * 100) / 100,
  };
}

/**
 * Detecta se existe um rosto na imagem.
 * Usa o serviço de Detection do CompreFace.
 */
export async function detectarFace(imagem: File): Promise<DeteccaoResult> {
  const formData = new FormData();
  formData.append("file", imagem);

  const res = await fetch(`${COMPREFACE_URL}/api/v1/detection/detect`, {
    method: "POST",
    headers: {
      "x-api-key": DETECT_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CompreFace detect error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const faces = data?.result ?? [];

  return {
    faceDetected: faces.length > 0,
    facesCount: faces.length,
  };
}

/**
 * Converts a data URL to a File object for upload.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
