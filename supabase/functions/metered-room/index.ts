import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { appointmentId } = await req.json();
    if (!appointmentId) {
      return new Response(JSON.stringify({ error: "appointmentId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appName = Deno.env.get("METERED_APP_NAME");
    const secretKey = Deno.env.get("METERED_SECRET_KEY");

    if (!appName || !secretKey) {
      return new Response(JSON.stringify({ error: "Metered credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roomName = `consulta-${appointmentId.replace(/-/g, "").slice(0, 16)}`;

    // Try to get existing room first
    const getRes = await fetch(
      `https://${appName}.metered.live/api/v1/room/${roomName}?secretKey=${secretKey}`
    );

    if (getRes.ok) {
      const room = await getRes.json();
      return new Response(JSON.stringify({
        roomURL: `${appName}.metered.live/${roomName}`,
        roomName: room.roomName,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create room if it doesn't exist
    const createRes = await fetch(
      `https://${appName}.metered.live/api/v1/room?secretKey=${secretKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          privacy: "public",
          autoJoin: true,
          maxParticipants: 4,
          ejectAtRoomExp: true,
          // Expire room 4 hours from now
          expireUnixSec: Math.floor(Date.now() / 1000) + 4 * 3600,
        }),
      }
    );

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Metered create room error:", err);
      return new Response(JSON.stringify({ error: "Failed to create room", details: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const room = await createRes.json();
    return new Response(JSON.stringify({
      roomURL: `${appName}.metered.live/${room.roomName}`,
      roomName: room.roomName,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
