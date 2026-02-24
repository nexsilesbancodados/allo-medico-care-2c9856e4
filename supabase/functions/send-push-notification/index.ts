import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push utilities using Web Crypto API
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function importVapidKeys(publicKeyBase64: string, privateKeyBase64: string) {
  const publicKeyBytes = urlBase64ToUint8Array(publicKeyBase64);
  const privateKeyBytes = urlBase64ToUint8Array(privateKeyBase64);

  const publicKey = await crypto.subtle.importKey(
    "raw",
    publicKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    []
  );

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );

  return { publicKey, privateKey };
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJWT(
  audience: string,
  subject: string,
  privateKey: CryptoKey
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const encodedHeader = arrayBufferToBase64Url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = arrayBufferToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  // Convert DER signature to raw (r || s)
  const sigArray = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;

  if (sigArray[0] === 0x30) {
    // DER encoded
    const rLen = sigArray[3];
    const rStart = 4;
    const rBytes = sigArray.slice(rStart, rStart + rLen);
    const sLen = sigArray[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    const sBytes = sigArray.slice(sStart, sStart + sLen);

    r = rBytes.length > 32 ? rBytes.slice(rBytes.length - 32) : rBytes;
    s = sBytes.length > 32 ? sBytes.slice(sBytes.length - 32) : sBytes;

    if (r.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(r, 32 - r.length);
      r = padded;
    }
    if (s.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(s, 32 - s.length);
      s = padded;
    }
  } else {
    r = sigArray.slice(0, 32);
    s = sigArray.slice(32, 64);
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  const encodedSignature = arrayBufferToBase64Url(rawSig.buffer);
  return `${signingInput}.${encodedSignature}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: CryptoKey
): Promise<Response> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await createJWT(
    audience,
    "mailto:lopesgustavo4377@gmail.com",
    vapidPrivateKey
  );

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body: new TextEncoder().encode(payload),
  });

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY =
      "BAcxZjzip4n-k1ifUoCKTHN8s2fo9woakP0bT1_2bim88q4vvDDFhrm5Ydg2Q_dg8-paX0lg39E6fq0KysNKkmg";
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPID_PRIVATE_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, title, message, link } = await req.json();

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: "user_id, title, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get push subscriptions for the user
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError || !subscriptions?.length) {
      console.log("No push subscriptions found for user:", user_id);
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: "No subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({ title, body: message, url: link || "/" });

    let sent = 0;
    let failed = 0;

    // Note: Full web-push encryption requires complex ECDH + HKDF.
    // For production, consider using a web-push library.
    // This sends a simple notification payload.
    for (const sub of subscriptions) {
      try {
        const url = new URL(sub.endpoint);
        const audience = `${url.protocol}//${url.host}`;

        const { privateKey } = await importVapidKeys(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        const jwt = await createJWT(audience, "mailto:lopesgustavo4377@gmail.com", privateKey);

        const res = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            TTL: "86400",
            Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
          },
        });

        if (res.ok || res.status === 201) {
          sent++;
        } else {
          console.error(`Push failed for endpoint ${sub.endpoint}: ${res.status}`);
          failed++;
          // Remove expired subscriptions
          if (res.status === 404 || res.status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
        await res.text(); // consume body
      } catch (err) {
        console.error("Push send error:", err);
        failed++;
      }
    }

    // Also create in-app notification
    await supabase.from("notifications").insert({
      user_id,
      title,
      message,
      link,
      type: "push",
    });

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
