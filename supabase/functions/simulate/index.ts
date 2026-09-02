import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Matches simulator/index.js: the 6 Lagos waypoints 0/20/40/60/80/100%.
const statusFor = (progress: number) => {
  if (progress === 0) return "order_placed";
  if (progress < 40) return "picked_up";
  if (progress < 100) return "on_the_way";
  return "delivered";
};

const MAX_ETA_MINUTES = 18;
const STEP_MS = 2000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Authenticate the caller via the JWT from the anon key. Only a signed-in
  // user may trigger a simulation of one of their own deliveries.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const user = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user.data.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = user.data.user.id;

  let body: { action?: string; delivery_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    // optional body
  }

  const action = body.action ?? "run";
  const deliveryId = body.delivery_id;

  if (!deliveryId) {
    return new Response(JSON.stringify({ error: "delivery_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load the delivery and confirm ownership.
  const { data: delivery, error: deliveryError } = await admin
    .from("deliveries")
    .select("id, user_id, route")
    .eq("id", deliveryId)
    .single();

  if (deliveryError || !delivery) {
    return new Response(JSON.stringify({ error: "Delivery not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (delivery.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const route = delivery.route as Array<{ lat: number; lng: number }> | null;
  if (!Array.isArray(route) || route.length < 2) {
    return new Response(JSON.stringify({ error: "Delivery has no route" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "reset") {
    const start = route[0];
    const { error } = await admin
      .from("deliveries")
      .update({
        status: "on_the_way",
        current_lat: start.lat,
        current_lng: start.lng,
        route_progress: 0,
        eta_minutes: MAX_ETA_MINUTES,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deliveryId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ ok: true, action: "reset", progress: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (action === "run") {
    // Launch the loop and return immediately so the app can render the
    // button state while realtime updates the truck in the background.
    const total = route.length - 1;
    (async () => {
      for (let i = 0; i < route.length; i++) {
        const progress = Math.round((i / total) * 100);
        const status = statusFor(progress);
        const { error } = await admin
          .from("deliveries")
          .update({
            current_lat: route[i].lat,
            current_lng: route[i].lng,
            status,
            route_progress: progress,
            eta_minutes: Math.max(1, Math.round(((total - i) / total) * MAX_ETA_MINUTES)),
            updated_at: new Date().toISOString(),
          })
          .eq("id", deliveryId);
        if (error) {
          console.error("run step failed", error.message);
          break;
        }
        if (i < route.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, STEP_MS));
        }
      }
    })();
    return new Response(
      JSON.stringify({ ok: true, action: "run", steps: route.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});