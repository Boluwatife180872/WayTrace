// simulator/test-realtime.js
// Diagnostic: subscribe to realtime on `deliveries`, then fire an UPDATE via the
// service role key and report whether the event arrives within 6s.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DELIVERY_ID = process.argv[2];

async function main() {
  if (!DELIVERY_ID) {
    console.error('Usage: node test-realtime.js <delivery-id>');
    process.exit(1);
  }

  const { data: rows } = await svc.from('deliveries').select('id, status, route_progress').limit(5);
  console.log('Rows in deliveries:', JSON.stringify(rows, null, 2));

  const found = rows?.find((r) => r.id === DELIVERY_ID) ?? rows?.[0];
  if (!found) {
    console.error('No delivery row found.');
    process.exit(1);
  }
  console.log(`Targeting delivery: ${found.id}`);

  const { error: subErr } = svc
    .channel('diag-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'deliveries', filter: `id=eq.${found.id}` },
      (payload) => {
        console.log('REALTIME EVENT RECEIVED ✔️', JSON.stringify(payload.new, null, 2));
        process.exit(0);
      }
    )
    .subscribe((status, err) => {
      console.log('Subscribe status:', status, err?.message ?? '');
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('Realtime channel failed to connect:', err?.message ?? status);
        process.exit(1);
      }
    });

  await new Promise((r) => setTimeout(r, 1500));

  const { error: updErr } = await svc
    .from('deliveries')
    .update({
      status: found.status === 'delivered' ? 'on_the_way' : found.status,
      route_progress: found.route_progress + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', found.id);

  if (updErr) {
    console.error('UPDATE failed:', updErr.message);
    process.exit(1);
  }
  console.log('UPDATE sent. Waiting up to 6s for realtime event...');

  await new Promise((r) => setTimeout(r, 6000));
  console.log('NO REALTIME EVENT RECEIVED ✖️');
  try {
    await svc.removeChannel('diag-realtime');
  } catch (_) {}
  process.exit(1);
}

main();