import * as faceapi from "face-api.js";

const MODELS_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model";

let modelsLoaded = false;

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
  ]);
  modelsLoaded = true;
  console.log("[KYC] Face-api models loaded");
}

export async function extractTextFromImage(imageFile: Blob): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por");
  const url = URL.createObjectURL(imageFile);
  const { data } = await worker.recognize(url);
  URL.revokeObjectURL(url);
  await worker.terminate();
  return data.text;
}

export function parseCRMFromText(text: string): { crm: string | null; name: string | null } {
  const crmMatch = text.match(/CRM[\s\-:]*(\d{4,7})/i);
  const nameMatch = text.match(
    /(?:Nome|Dr\.?|Dra\.?|Médico)\s*[:\-]?\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,5})/
  );
  return {
    crm: crmMatch ? crmMatch[1] : null,
    name: nameMatch ? nameMatch[1].trim() : null,
  };
}

export function nameSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  const wordsA = na.split(" ");
  const wordsB = nb.split(" ");
  const common = wordsA.filter((w) => wordsB.includes(w)).length;
  return common / Math.max(wordsA.length, wordsB.length);
}

export async function detectFace(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>> | null> {
  const result = await faceapi
    .detectSingleFace(input)
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result ?? null;
}

export function computeFaceDistance(desc1: Float32Array, desc2: Float32Array): number {
  return faceapi.euclideanDistance(desc1, desc2);
}

export function detectBlink(
  landmarks: faceapi.FaceLandmarks68
): { leftEAR: number; rightEAR: number; avgEAR: number } {
  const getPoint = (i: number) => landmarks.positions[i];

  // Eye Aspect Ratio (EAR) calculation
  // Left eye points: 36-41, Right eye: 42-47
  const ear = (pts: number[]) => {
    const p1 = getPoint(pts[1]);
    const p2 = getPoint(pts[2]);
    const p3 = getPoint(pts[3]);
    const p4 = getPoint(pts[4]);
    const p5 = getPoint(pts[5]);
    const p0 = getPoint(pts[0]);
    const vertDist1 = Math.sqrt((p1.x - p5.x) ** 2 + (p1.y - p5.y) ** 2);
    const vertDist2 = Math.sqrt((p2.x - p4.x) ** 2 + (p2.y - p4.y) ** 2);
    const horizDist = Math.sqrt((p0.x - p3.x) ** 2 + (p0.y - p3.y) ** 2);
    return (vertDist1 + vertDist2) / (2 * horizDist);
  };

  const leftEAR = ear([36, 37, 38, 39, 40, 41]);
  const rightEAR = ear([42, 43, 44, 45, 46, 47]);
  return { leftEAR, rightEAR, avgEAR: (leftEAR + rightEAR) / 2 };
}

export async function extractFaceFromImage(imageBlob: Blob): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const detection = await faceapi.detectSingleFace(img).withFaceLandmarks();
      if (!detection) {
        resolve(null);
        return;
      }
      const box = detection.detection.box;
      const canvas = document.createElement("canvas");
      canvas.width = box.width;
      canvas.height = box.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
      resolve(canvas);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(imageBlob);
  });
}
