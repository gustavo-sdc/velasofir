import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/platform/server/staff";
import { privilegedDatabase } from "@/platform/server/supabase";
import {
  asaasConfiguration,
  createAsaasCheckout,
  cancelAsaasCheckout,
  AsaasRequestError,
} from "@/platform/server/asaas";
import { orderInput, type CommerceOrder } from "@/platform/domain/orders";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  let session;
  try {
    session = await requireStaff(["owner", "admin"]);
  } catch {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403, headers },
    );
  }
  const [orders, events] = await Promise.all([
    session.db
      .from("commerce_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    session.db
      .from("asaas_events")
      .select("id", { count: "exact", head: true })
      .in("outcome", ["unmatched", "unsupported"]),
  ]);
  if (orders.error || events.error)
    return NextResponse.json(
      { error: "Não foi possível consultar os pedidos." },
      { status: 503, headers },
    );
  return NextResponse.json(
    {
      orders: orders.data,
      unmatchedEvents: events.count ?? 0,
      config: asaasConfiguration(),
    },
    { headers },
  );
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403, headers },
    );
  let session;
  try {
    session = await requireStaff(["owner", "admin"]);
  } catch {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403, headers },
    );
  }
  const config = asaasConfiguration();
  if (!config.ready)
    return NextResponse.json(
      { error: "ASAAS ainda não configurado e habilitado neste ambiente." },
      { status: 503, headers },
    );
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 10000)
      return NextResponse.json(
        { error: "Pedido muito grande." },
        { status: 413, headers },
      );
    const parsed = orderInput.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Confira os dados." },
        { status: 400, headers },
      );
    const input = parsed.data;
    const db = privilegedDatabase();
    const reserved = await db.rpc("ofir_reserve_order", {
      p_id: input.id,
      p_actor: session.user.id,
      p_environment: config.environment,
      p_kind: input.kind,
      p_catalog: input.catalog_id,
      p_ticket: input.ticket_name,
      p_quantity: input.quantity,
      p_name: input.customer_name,
      p_email: input.customer_email,
      p_shipping: input.shipping_cents,
      p_delivery: input.delivery_description,
      p_expected_total: input.expected_total_cents,
    });
    if (reserved.error)
      return NextResponse.json(
        {
          error:
            "Não foi possível reservar. Confira estoque, preço, prazo, vagas, disponibilidade do ingresso e condições de entrega.",
        },
        { status: 409, headers },
      );
    const order = (
      Array.isArray(reserved.data) ? reserved.data[0] : reserved.data
    ) as CommerceOrder;
    if (!order?.id) throw Error();
    if (order.checkout_id || !["reserved", "creating"].includes(order.status))
      return NextResponse.json({ order }, { headers });
    const claimed = await db.rpc("ofir_claim_checkout", { p_id: order.id });
    if (claimed.error) throw Error();
    if (!claimed.data)
      return NextResponse.json(
        {
          processing: true,
          error:
            "Este pedido já está sendo processado. Aguarde o webhook e confira o ASAAS antes de criar outro pedido.",
        },
        { status: 202, headers },
      );
    const items = [
      {
        name: order.item_name,
        quantity: order.quantity,
        unitCents: order.unit_cents,
      },
    ];
    if (order.shipping_cents > 0)
      items.push({
        name: "Frete confirmado com a cliente",
        quantity: 1,
        unitCents: order.shipping_cents,
      });
    try {
      const checkout = await createAsaasCheckout({ id: order.id, items });
      const linked = await db.rpc("ofir_attach_checkout", {
        p_id: order.id,
        p_checkout: checkout.id,
      });
      if (linked.error) throw new AsaasRequestError(false);
      revalidatePath("/admin");
      revalidatePath("/loja");
      revalidatePath("/workshops", "layout");
      return NextResponse.json(
        {
          order: { ...order, checkout_id: checkout.id, status: "pending" },
          checkoutUrl: checkout.url,
        },
        { headers },
      );
    } catch (error) {
      if (error instanceof AsaasRequestError && error.definiteRejection) {
        const closed = await db.rpc("ofir_close_unpaid_order", {
          p_id: order.id,
          p_status: "failed",
        });
        if (closed.error) throw Error();
        return NextResponse.json(
          {
            definiteRejection: true,
            error:
              "O ASAAS recusou a criação. A reserva foi liberada; confira a configuração antes de criar um novo pedido.",
          },
          { status: 409, headers },
        );
      }
      return NextResponse.json(
        {
          processing: true,
          error:
            "A resposta do ASAAS ficou inconclusiva. Não gere outro pagamento: o pedido e a reserva foram mantidos para conciliação pelo webhook.",
        },
        { status: 202, headers },
      );
    }
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível processar o pedido. Consulte o painel antes de tentar novamente.",
      },
      { status: 503, headers },
    );
  }
}
export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403, headers },
    );
  try {
    const session = await requireStaff(["owner", "admin"]);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 1000)
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 413, headers },
      );
    const input = z.object({ id: z.uuid() }).parse(JSON.parse(raw));
    const order = await session.db
      .from("commerce_orders")
      .select("id,checkout_id,status,environment")
      .eq("id", input.id)
      .maybeSingle();
    if (order.error || !order.data)
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404, headers },
      );
    if (
      order.data.environment !== asaasConfiguration().environment ||
      order.data.status !== "pending" ||
      !order.data.checkout_id
    )
      return NextResponse.json(
        { error: "Este pedido exige conferência manual no ASAAS." },
        { status: 409, headers },
      );
    await cancelAsaasCheckout(order.data.checkout_id);
    const update = await privilegedDatabase()
      .from("commerce_orders")
      .update({
        status: "cancel_requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("status", "pending");
    if (update.error) throw Error();
    return NextResponse.json(
      {
        ok: true,
        message:
          "Cancelamento solicitado. A reserva só é liberada após confirmação do ASAAS.",
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível cancelar. Confira sua sessão, MFA e a situação no ASAAS antes de repetir.",
      },
      { status: 409, headers },
    );
  }
}
