import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { privilegedDatabase } from "@/platform/server/supabase";

function validSignature(request: Request, dataId: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!secret || !signature || !requestId || !dataId) return false;
  const fields = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
  if (!fields.ts || !fields.v1 || !/^[a-f0-9]{64}$/i.test(fields.v1)) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${fields.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();
  const received = Buffer.from(fields.v1, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? "";
  if (!validSignature(request, dataId)) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 100000) return NextResponse.json({ error: "Evento muito grande." }, { status: 413 });
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 100000) return NextResponse.json({ error: "Evento muito grande." }, { status: 413 });
    const notice = JSON.parse(raw);
    const orderId = String(notice.data?.id ?? dataId);
    if (notice.type !== "order" || orderId !== dataId || !/^[A-Za-z0-9_-]{10,64}$/.test(orderId)) return NextResponse.json({ received: true });
    const simulatedReference = String(notice.data?.external_reference ?? "");
    if (simulatedReference && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(simulatedReference))
      return NextResponse.json({ received: true });
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) return NextResponse.json({ error: "Integração não configurada." }, { status: 503 });
    const response = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return NextResponse.json({ error: "Pedido ainda não pode ser consultado." }, { status: 503 });
    const mercadoPagoOrder = await response.json();
    const db = privilegedDatabase();
    const externalReference = String(mercadoPagoOrder.external_reference ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(externalReference)) return NextResponse.json({ received: true });
    const order = await db.from("customer_orders").select("id,total_cents,mercado_pago_order_id").eq("id", externalReference).maybeSingle();
    if (order.error) throw Error();
    if (!order.data) return NextResponse.json({ error: "Pedido ainda não sincronizado." }, { status: 503 });
    if (!order.data.mercado_pago_order_id) return NextResponse.json({ error: "Checkout ainda está sendo sincronizado." }, { status: 503 });
    if (order.data.mercado_pago_order_id !== orderId) return NextResponse.json({ received: true });
    const noticeId = String(notice.id ?? `${orderId}-${mercadoPagoOrder.status}-${mercadoPagoOrder.last_updated_date ?? ""}`);
    const previous = await db.from("mercado_pago_events").select("outcome").eq("id", noticeId).maybeSingle();
    if (previous.error) throw Error();
    if (previous.data?.outcome === "processed") return NextResponse.json({ received: true });
    const paidCents = Math.round(Number(mercadoPagoOrder.total_paid_amount) * 100);
    const currency = mercadoPagoOrder.currency ?? mercadoPagoOrder.currency_id ?? notice.data?.currency_id;
    const amountMatches = currency === "BRL" && paidCents === order.data.total_cents;
    let paymentStatus = "pending";
    let fulfillmentStatus = "awaiting_payment";
    let inventoryAction = "none";
    let outcome = "processed";
    if (mercadoPagoOrder.status === "processed") {
      if (!amountMatches) { paymentStatus = "review"; outcome = "amount_review"; }
      else { paymentStatus = "approved"; fulfillmentStatus = "payment_confirmed"; inventoryAction = "commit"; }
    } else if (["canceled", "cancelled", "expired"].includes(String(mercadoPagoOrder.status))
      || ["canceled", "cancelled", "expired"].includes(String(mercadoPagoOrder.status_detail))) {
      paymentStatus = "cancelled"; fulfillmentStatus = "cancelled"; inventoryAction = "release";
    } else if (mercadoPagoOrder.status === "failed") {
      paymentStatus = "rejected"; fulfillmentStatus = "cancelled"; inventoryAction = "release";
    }
    const paymentId = String(mercadoPagoOrder.transactions?.payments?.[0]?.id ?? "");
    const applied = await db.rpc("ofir_apply_mercado_pago_order_state", {
      p_order_id: order.data.id,
      p_payment_status: paymentStatus,
      p_fulfillment_status: fulfillmentStatus,
      p_payment_id: paymentId,
      p_inventory_action: inventoryAction,
    });
    if (applied.error) throw Error();
    if (applied.data === "reservation_missing") outcome = "reservation_review";
    if (applied.data === "terminal_ignored") outcome = "terminal_ignored";
    const stored = await db.from("mercado_pago_events").upsert({
      id: noticeId, event_type: String(notice.action ?? "order.updated").slice(0, 100),
      payment_id: paymentId || null, order_id: order.data.id, outcome,
    }, { onConflict: "id" });
    if (stored.error) throw Error();
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Notificação não processada; o Mercado Pago pode reenviá-la." }, { status: 503 });
  }
}
