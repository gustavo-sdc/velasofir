import "server-only";
import { requireStaff } from "./staff";
import { privilegedDatabase } from "./supabase";
export type Purchase = {
  uuid: string;
  reference?: string;
  description?: string;
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
    for (let start = 0; ; start += 500) {
      const customerOrders = await db
        .from("customer_orders")
        .select("id,customer_email,items,payment_status,fulfillment_status,created_at")
        .order("created_at", { ascending: false })
        .range(start, start + 499);
      if (customerOrders.error) throw customerOrders.error;
      for (const order of customerOrders.data ?? []) {
        const items = Array.isArray(order.items)
          ? (order.items as {
              kind?: unknown;
              name?: unknown;
              ticket_name?: unknown;
              quantity?: unknown;
              unit_cents?: unknown;
            }[])
          : [];
        items.forEach((item, index) => {
          const quantity = Number(item.quantity);
          const unitCents = Number(item.unit_cents);
          if (
            !Number.isSafeInteger(quantity) || quantity < 1 ||
            !Number.isSafeInteger(unitCents) || unitCents < 0
          ) return;
          const paymentStatus = String(order.payment_status);
          const status = paymentStatus === "approved"
            ? String(order.fulfillment_status)
            : paymentStatus;
          const name = String(item.name ?? "Item do pedido");
          const ticketName = String(item.ticket_name ?? "");
          rows.push({
            uuid: `customer-order:${order.id}:${index}`,
            reference: String(order.id).slice(0, 8),
            description: ticketName ? `${name} — ${ticketName}` : name,
            client_id: String(order.customer_email ?? "").trim().toLowerCase(),
            type: item.kind === "workshop" ? "event_ticket" : "product",
            quantity,
            value: (quantity * unitCents) / 100,
            status,
            buy_date: String(order.created_at),
          });
        });
      }
      if ((customerOrders.data ?? []).length < 500) break;
    }
    return { available: true, rows };
  } catch {
    return { available: false, rows: [] as Purchase[] };
  }
}
