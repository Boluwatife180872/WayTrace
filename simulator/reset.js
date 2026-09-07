// simulator/reset.js  <delivery-id>
// Reset a deliveries row back to on-the-way so the Tracking screen shows it again.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node reset.js <delivery-id>');
    process.exit(1);
  }
  const { data: delivery, error: deliveryError } = await svc
    .from('deliveries')
    .select('route')
    .eq('id', id)
    .single();

  if (deliveryError) {
    console.error('Could not load delivery route:', deliveryError.message);
    process.exit(1);
  }

  const start = delivery.route?.[0];
  if (!Number.isFinite(start?.lat) || !Number.isFinite(start?.lng)) {
    console.error('Delivery route must start with a valid { lat, lng } point.');
    process.exit(1);
  }

  const { data, error } = await svc
    .from('deliveries')
    .update({
      status: 'on_the_way',
      current_lat: start.lat,
      current_lng: start.lng,
      route_progress: 0,
      eta_minutes: 28,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, status, route_progress, eta_minutes');
  if (error) {
    console.error('Reset failed:', error.message);
    process.exit(1);
  }
  console.log('Reset ok:', JSON.stringify(data));
}

main();
