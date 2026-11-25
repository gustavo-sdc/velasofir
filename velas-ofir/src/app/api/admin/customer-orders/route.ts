import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/platform/server/staff";
import { privilegedDatabase } from "@/platform/server/supabase";
const noCache = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await requireStaff(["owner", "admin", "support"]);
    const { data, error } = await privilegedDatabase().from("customer_orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ orders: data }, { headers: noCache });
  } catch { return NextResponse.json({ error: "Não foi possível consultar os pedidos." }, { status: 403, headers: noCache }); }
}

export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origem não permitida." }, { status: 403, headers: noCache });
  try {
    await requireStaff(["owner", "admin"]);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 1000) return NextResponse.json({ error: "Dados inválidos." }, { status: 413, headers: noCache });
    const parsed = z.object({ id: z.uuid(), fulfillment_status: z.enum(["preparing", "shipped", "delivered"]) }).safeParse(JSON.parse(raw));
    if (!parsed.success) return NextResponse.json({ error: "Situação inválida." }, { status: 400, headers: noCache });
    const db = privilegedDatabase();
    const current = await db.from("customer_orders").select("payment_status,fulfillment_status").eq("id", parsed.data.id).maybeSingle();
    if (current.error || !current.data) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404, headers: noCache });
    const allowed = current.data.payment_status === "approved" && ({
      payment_confirmed: ["preparing"], preparing: ["shipped"], shipped: ["delivered"],
    } as Record<string, string[]>)[current.data.fulfillment_status]?.includes(parsed.data.fulfillment_status);
    if (!allowed) return NextResponse.json({ error: "O pedido precisa avançar pela sequência de preparação e entrega." }, { status: 409, headers: noCache });
    const update = await db.from("customer_orders").update({ fulfillment_status: parsed.data.fulfillment_status, updated_at: new Date().toISOString() }).eq("id", parsed.data.id).eq("fulfillment_status", current.data.fulfillment_status);
    if (update.error) throw Error();
    return NextResponse.json({ ok: true }, { headers: noCache });
  } catch { return NextResponse.json({ error: "Não foi possível atualizar o pedido." }, { status: 403, headers: noCache }); }
}
