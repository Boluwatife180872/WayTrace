// simulator/index.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isRoutePoint(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng);
}

// Interpolate sub-points per route edge. With 6 Lagos waypoints (5 edges)
// and segmentsPerEdge=1, the track is exactly 6 stops → 0/20/40/60/80/100%.
function buildTrack(route, segmentsPerEdge = 1) {
  const points = [];
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    for (let s = 0; s < segmentsPerEdge; s++) {
      const t = s / segmentsPerEdge;
      points.push({
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
      });
    }
  }
  points.push(route[route.length - 1]);
  return points;
}

// Longer Lagos journey → higher starting ETA.
const MAX_ETA_MINUTES = 18;

function statusFor(progress) {
  if (progress === 0) return 'order_placed';
  if (progress < 40) return 'picked_up';
  if (progress < 100) return 'on_the_way';
  return 'delivered';
}

async function run(deliveryId) {
  if (!deliveryId) {
    console.error('Usage: node index.js <delivery-id>');
    process.exit(1);
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .select('route')
    .eq('id', deliveryId)
    .single();

  if (deliveryError) {
    console.error('Could not load delivery route:', deliveryError.message);
    return;
  }

  const route = delivery.route;
  if (!Array.isArray(route) || route.length < 2 || !route.every(isRoutePoint)) {
    console.error('Delivery route must contain at least two valid { lat, lng } points.');
    return;
  }

  const track = buildTrack(route);
  const total = track.length - 1;

  for (let i = 0; i < track.length; i++) {
    const progress = Math.round((i / total) * 100); // 0 → 100
    const status = statusFor(progress);

    const { error } = await supabase
      .from('deliveries')
      .update({
        current_lat: track[i].lat,
        current_lng: track[i].lng,
        status,
        route_progress: progress,
        eta_minutes: Math.max(1, Math.round(((total - i) / total) * MAX_ETA_MINUTES)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryId);

    if (error) {
      console.error('Update failed:', error.message);
      return;
    }

    console.log(`Step ${i + 1}/${track.length} — status: ${status} (${progress}%)`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5s between steps
  }

  console.log('Delivery complete.');
}

run(process.argv[2]);