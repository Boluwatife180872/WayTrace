// simulator/seed-history.js
// Inserts 500+ delivery_history rows for a test user (default: first profile).
// Re-runnable: removes previous #SEED-* rows first.
//   node seed-history.js [count]          (default 500)
//   node seed-history.js 1000 --user <uuid>
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STATUSES = ['Delivered', 'Delivered', 'Delivered', 'In Transit', 'Returned', 'Exception'];
const BATCH = 100;

// Stable Unsplash photo IDs, served at ~200px via ?w=200&q=60.
// Unsplash images are used elsewhere in this project (driver avatars) and
// load reliably in the app, unlike picsum.photos which redirects and is flaky on mobile.
const THUMBNAILS = [
  'photo-1523275335684-37898b6baf30',
  'photo-1505740420928-5e560c06d30e',
  'photo-1542291026-7eec264c27ff',
  'photo-1526170375885-4d8ecf77b99f',
  'photo-1553062407-98eeb64c6a62',
  'photo-1502977249166-824b3a8a4d6d',
  'photo-1516997121675-4c2d1684aa3e',
  'photo-1546435770-a3e426bf472b',
];

function thumbnail(i) {
  const id = THUMBNAILS[i % THUMBNAILS.length];
  return `https://images.unsplash.com/${id}?w=200&q=60`;
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(...args) {
  return args[Math.floor(Math.random() * args.length)];
}

function statusTimestamps(status, deliveredMs) {
  const timestamps = {
    order_placed: new Date(deliveredMs - rnd(3, 6) * 3600e3).toISOString(),
    picked_up: new Date(deliveredMs - rnd(1, 3) * 3600e3).toISOString(),
    on_the_way: new Date(deliveredMs - rnd(0, 1) * 3600e3).toISOString(),
  };
  if (status === 'Delivered') {
    timestamps.delivered = new Date(deliveredMs).toISOString();
  }
  return timestamps;
}

function buildRows(userId, count) {
  const now = Date.now();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const status = pick(...STATUSES);
    const deliveredMs = now - Math.random() * 180 * 24 * 3600e3; // last ~180 days
    const lat = 37.78 + Math.random() * 0.06;
    const lng = -122.44 + Math.random() * 0.06;
    rows.push({
      user_id: userId,
      order_id: `#SEED-${1000 + i}`,
      status,
      price: rnd(5, 120) + 0.99,
      thumbnail_url: thumbnail(i),
      delivered_at: status === 'Delivered' ? new Date(deliveredMs).toISOString() : null,
      route_snapshot: [{ lat, lng }],
      status_timestamps: statusTimestamps(status, deliveredMs),
    });
  }
  return rows;
}

async function main() {
  const argv = process.argv.slice(2);
  const userArg = argv.includes('--user') ? argv[argv.indexOf('--user') + 1] : null;
  const count = Number(argv.find((a) => /^\d+$/.test(a)) || 500);

  let userId = userArg;
  if (!userId) {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error || !data?.length) {
      console.error('No profile found. Pass --user <uuid>');
      return;
    }
    userId = data[0].id;
  }

  const { error: deleteError } = await supabase
    .from('delivery_history')
    .delete()
    .eq('user_id', userId)
    .like('order_id', '#SEED-%');
  if (deleteError) {
    console.error('Cleanup failed:', deleteError.message);
    return;
  }

  const rows = buildRows(userId, count);
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from('delivery_history').insert(rows.slice(i, i + BATCH));
    if (error) {
      console.error(`Insert failed at ${i}:`, error.message);
      return;
    }
    process.stdout.write(`\rInserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log(`\nDone. ${rows.length} history rows for user ${userId}`);
}

main();