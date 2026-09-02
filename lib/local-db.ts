import * as SQLite from "expo-sqlite";
import type { Delivery, DeliveryHistory } from "@/types/delivery";

const db = SQLite.openDatabaseSync("trackr.db");

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS cached_delivery (
    user_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS cached_history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    order_id TEXT,
    status TEXT,
    price REAL,
    thumbnail_url TEXT,
    delivered_at TEXT
  );
`);

export function saveDeliveryToCache(userId: string, delivery: Delivery) {
  db.runSync(
    `INSERT OR REPLACE INTO cached_delivery (user_id, data, updated_at) VALUES (?, ?, ?);`,
    [userId, JSON.stringify(delivery), Date.now()]
  );
}

export function getCachedDelivery(userId: string): {
  delivery: Delivery;
  updatedAt: number;
} | null {
  const row = db.getFirstSync<{ data: string; updated_at: number }>(
    `SELECT data, updated_at FROM cached_delivery WHERE user_id = ?;`,
    [userId]
  );
  if (!row) return null;
  try {
    return { delivery: JSON.parse(row.data), updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

export function saveHistoryToCache(userId: string, rows: DeliveryHistory[]) {
  db.withTransactionSync(() => {
    for (const row of rows) {
      db.runSync(
        `INSERT OR REPLACE INTO cached_history
         (id, user_id, order_id, status, price, thumbnail_url, delivered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          row.id,
          userId,
          row.order_id,
          row.status,
          row.price,
          row.thumbnail_url,
          row.delivered_at,
        ]
      );
    }
    // Trim cache to the same 100-row window we show online.
    db.runSync(
      `DELETE FROM cached_history WHERE id NOT IN (
         SELECT id FROM cached_history ORDER BY delivered_at DESC LIMIT 100
       );`
    );
  });
}

export function getCachedHistory(userId: string): DeliveryHistory[] {
  const rows = db.getAllSync<DeliveryHistory>(
    `SELECT * FROM cached_history WHERE user_id = ? ORDER BY delivered_at DESC LIMIT 100;`,
    [userId]
  );
  return rows;
}