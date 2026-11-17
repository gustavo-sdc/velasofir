import "server-only";
import { requireStaff } from "./staff";
import { privilegedDatabase } from "./supabase";
export type Purchase = {
  uuid: string;
  client_id: string;
  type: string;
  quantity: number;
  value: number;
  status: string;
  buy_date: string;
};
export async function adminOperations() {
  await requireStaff(["owner", "admin"]);
  try {
    const db = privilegedDatabase();
    const rows: Purchase[] = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await db
        .from("buy_history")
        .select("uuid,client_id,type,quantity,value,status,buy_date")
        .order("uuid")
        .range(start, start + 999);
      if (error) throw error;
      rows.push(...(data as Purchase[]));
      if (data.length < 1000) break;
    }
    // Concilia identidades pelo e-mail quando há correspondência no legado.
    const legacyIds = [...new Set(rows.map((row) => row.client_id))];
    const identities = new Map<string, string>();
    for (let start = 0; start < legacyIds.length; start += 200) {
      const clients = await db
        .from("client")
        .select("uuid,email")
        .in("uuid", legacyIds.slice(start, start + 200));
      if (clients.error) throw clients.error;
      for (const client of clients.data ?? [])
        identities.set(client.uuid, String(client.email).trim().toLowerCase());
    }
    for (const row of rows)
      row.client_id = identities.get(row.client_id) ?? row.client_id;
    for (let start = 0; ; start += 1000) {
      const fresh = await db
        .from("commerce_orders")
        .select("id,customer_email,kind,quantity,total_cents,status,created_at")
        .eq("environment", "production")
        .order("id")
        .range(start, start + 999);
      if (fresh.error) throw fresh.error;
      for (const order of fresh.data ?? [])
        rows.push({
          uuid: order.id,
          client_id: String(order.customer_email).trim().toLowerCase(),
          type: order.kind === "product" ? "product" : "event_ticket",
          quantity: order.quantity,
          value: order.total_cents / 100,
          status: order.status,
          buy_date: order.created_at,
        });
      if ((fresh.data ?? []).length < 1000) break;
    }
    return { available: true, rows };
  } catch {
    return { available: false, rows: [] as Purchase[] };
  }
}
