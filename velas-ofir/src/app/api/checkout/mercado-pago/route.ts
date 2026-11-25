import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionDatabase, privilegedDatabase } from "@/platform/server/supabase";

const noCache = { "Cache-Control": "no-store" };
type PaymentPreference = "standard" | "cash" | "installments_3" | "installments_6" | "installments_12" | "no_ticket";
type CheckoutLine = {
  kind: "product" | "workshop";
  catalog_id: string;
  name: string;
  ticket_name: string;
  quantity: number;
  unit_cents: number;
  payment_preference: PaymentPreference;
};
const installmentLimit: Partial<Record<PaymentPreference, number>> = {
  cash: 1, installments_3: 3, installments_6: 6, installments_12: 12,
};
const inputSchema = z.object({
  items: z.array(z.object({
    kind: z.enum(["product", "workshop"]),
    catalog_id: z.uuid(),
    ticket_name: z.string().max(100).default(""),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(30),
});

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403, headers: noCache });
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!accessToken || !secret || !baseUrl)
    return NextResponse.json({ error: "Checkout Mercado Pago ainda não configurado." }, { status: 503, headers: noCache });
  let origin: URL;
  try { origin = new URL(baseUrl); } catch { return NextResponse.json({ error: "Endereço do site inválido." }, { status: 503, headers: noCache }); }
  if (origin.protocol !== "https:")
    return NextResponse.json({ error: "O checkout exige o domínio HTTPS publicado." }, { status: 503, headers: noCache });

  const session = await sessionDatabase();
  if (!session) return NextResponse.json({ error: "Conta indisponível." }, { status: 503, headers: noCache });
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Entre na sua conta para continuar." }, { status: 401, headers: noCache });
  const savedCart = await session.from("customer_cart").select("items").eq("user_id", user.id).maybeSingle();
  if (savedCart.error) return NextResponse.json({ error: "Não foi possível carregar sua sacola." }, { status: 503, headers: noCache });
  const parsed = inputSchema.safeParse({ items: savedCart.data?.items });
  if (!parsed.success) return NextResponse.json({ error: "Confira os itens da sua sacola." }, { status: 400, headers: noCache });

  const grouped = new Map<string, z.infer<typeof inputSchema>["items"][number]>();
  for (const item of parsed.data.items) {
    const key = `${item.kind}:${item.catalog_id}:${item.ticket_name}`;
    const current = grouped.get(key);
    const quantity = (current?.quantity ?? 0) + item.quantity;
    if (quantity > 20)
      return NextResponse.json({ error: "A quantidade máxima por item é 20." }, { status: 400, headers: noCache });
    grouped.set(key, { ...item, quantity });
  }
  const cartLines = [...grouped.values()].sort((a, b) =>
    `${a.kind}:${a.catalog_id}:${a.ticket_name}`.localeCompare(`${b.kind}:${b.catalog_id}:${b.ticket_name}`),
  );
  const cartFingerprint = createHash("sha256").update(JSON.stringify(cartLines)).digest("hex");

  try {
    const profile = await session.from("customer_profiles").select("full_name,birth_date,postal_code,street,address_number,address_complement,neighborhood,city,state").eq("user_id", user.id).maybeSingle();
    if (profile.error || !profile.data || profile.data.full_name.trim().length < 2)
      return NextResponse.json({ error: "Complete seu cadastro antes de pagar." }, { status: 409, headers: noCache });

    const db = privilegedDatabase();
    const openOrder = await db.from("customer_orders")
      .select("id,items,subtotal_cents,total_cents,checkout_url")
      .eq("customer_id", user.id)
      .eq("cart_fingerprint", cartFingerprint)
      .eq("payment_status", "pending")
      .maybeSingle();
    if (openOrder.error) throw Error("Não foi possível verificar uma tentativa anterior de checkout.");

    let id: string;
    let snapshot: CheckoutLine[];
    let totalCents: number;
    if (openOrder.data) {
      id = openOrder.data.id;
      snapshot = openOrder.data.items as CheckoutLine[];
      totalCents = openOrder.data.total_cents;
      if (openOrder.data.checkout_url) {
        await session.from("customer_cart").delete().eq("user_id", user.id);
        return NextResponse.json({ checkoutUrl: openOrder.data.checkout_url, orderId: id }, { headers: noCache });
      }
    } else {
      snapshot = [];
      for (const line of cartLines) {
        if (line.kind === "product") {
          const { data: product, error } = await db.from("products").select("id,name,price,published,kind,stock_quantity,accepts_orders,production_days,payment_preference").eq("id", line.catalog_id).maybeSingle();
          if (error || !product || !product.published || product.kind === "colecao") throw Error("Um produto da sacola não está disponível.");
          if (product.stock_quantity === 0 && !product.accepts_orders) throw Error("Um produto da sacola esgotou.");
          const unit = Math.round(Number(product.price) * 100);
          if (!Number.isSafeInteger(unit) || unit <= 0 || Math.abs(Number(product.price) * 100 - unit) > 0.001) throw Error("Preço inválido no catálogo.");
          snapshot.push({ ...line, name: String(product.name).slice(0, 160), unit_cents: unit, payment_preference: (product.payment_preference ?? "standard") as PaymentPreference });
        } else {
          const { data: workshop, error } = await db.from("workshops").select("id,title,starts_at,published,capacity,ticket_types,price_cents,payment_preference").eq("id", line.catalog_id).maybeSingle();
          if (error || !workshop || !workshop.published || new Date(workshop.starts_at).getTime() <= Date.now()) throw Error("Um workshop da sacola não está disponível.");
          const tickets = Array.isArray(workshop.ticket_types) ? workshop.ticket_types as { name: string; price_cents: number; quantity?: number; min_per_order?: number; max_per_order?: number; sales_start?: string | null; sales_end?: string | null }[] : [];
          const ticket: (typeof tickets)[number] | undefined = tickets.length ? tickets.find((item) => item.name === line.ticket_name) : { name: "Ingresso individual", price_cents: workshop.price_cents, quantity: workshop.capacity, min_per_order: 1, max_per_order: Math.min(20, workshop.capacity || 20), sales_start: null, sales_end: null };
          if (!ticket || line.quantity < (ticket.min_per_order ?? 1) || line.quantity > (ticket.max_per_order ?? 20)) throw Error("Confira o tipo e a quantidade de ingressos.");
          const now = Date.now();
          if ((ticket.sales_start && new Date(ticket.sales_start).getTime() > now) || (ticket.sales_end && new Date(ticket.sales_end).getTime() < now)) throw Error("As vendas deste ingresso estão fechadas.");
          const unit = Number(ticket.price_cents);
          if (!Number.isSafeInteger(unit) || unit <= 0) throw Error("Este ingresso não aceita pagamento online.");
          snapshot.push({ ...line, name: String(workshop.title).slice(0, 130), ticket_name: ticket.name, unit_cents: unit, payment_preference: (workshop.payment_preference ?? "standard") as PaymentPreference });
        }
      }

      const subtotal = snapshot.reduce((sum, item) => sum + item.quantity * item.unit_cents, 0);
      if (!Number.isSafeInteger(subtotal) || subtotal <= 0 || subtotal > 201000000) throw Error("Total inválido.");
      const address = Object.fromEntries(Object.entries(profile.data).filter(([key]) => key !== "birth_date"));
      id = crypto.randomUUID();
      const created = await db.from("customer_orders").insert({
        id, customer_id: user.id, customer_email: user.email, customer_name: profile.data.full_name,
        delivery_address: address, items: snapshot, subtotal_cents: subtotal, shipping_cents: 0,
        cart_fingerprint: cartFingerprint,
      }).select("id").single();
      if (created.error) {
        const racedOrder = await db.from("customer_orders")
          .select("id,items,subtotal_cents,total_cents,checkout_url")
          .eq("customer_id", user.id)
          .eq("cart_fingerprint", cartFingerprint)
          .eq("payment_status", "pending")
          .maybeSingle();
        if (racedOrder.error || !racedOrder.data) throw Error("Não foi possível registrar o pedido.");
        id = racedOrder.data.id;
        snapshot = racedOrder.data.items as CheckoutLine[];
        totalCents = racedOrder.data.total_cents;
        if (racedOrder.data.checkout_url) {
          await session.from("customer_cart").delete().eq("user_id", user.id);
          return NextResponse.json({ checkoutUrl: racedOrder.data.checkout_url, orderId: id }, { headers: noCache });
        }
      } else {
        id = created.data.id;
        totalCents = subtotal;
      }
    }

    const reservation = await db.rpc("ofir_reserve_customer_order_inventory", {
      p_order_id: id,
      p_items: snapshot,
    });
    if (reservation.error) {
      await db.rpc("ofir_apply_mercado_pago_order_state", {
        p_order_id: id,
        p_payment_status: "rejected",
        p_fulfillment_status: "cancelled",
        p_payment_id: "",
        p_inventory_action: "release",
      });
      throw Error(reservation.error.message.includes("Estoque") || reservation.error.message.includes("vagas") || reservation.error.message.includes("ingressos")
        ? reservation.error.message
        : "Não foi possível reservar os itens do pedido.");
    }

    const orderUrl = new URL(`/conta?pedido=${id}`, origin).toString();
    const limits = snapshot.map((item) => installmentLimit[item.payment_preference]).filter((value): value is number => Boolean(value));
    const paymentMethod: { max_installments?: number; not_allowed_types?: string[] } = {};
    if (limits.length) paymentMethod.max_installments = Math.min(...limits);
    if (snapshot.some((item) => item.payment_preference === "no_ticket")) paymentMethod.not_allowed_types = ["ticket"];
    const response = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Idempotency-Key": id },
      body: JSON.stringify({
        type: "online",
        processing_mode: "manual",
        capture_mode: "automatic_async",
        expiration_time: "P3D",
        total_amount: (totalCents / 100).toFixed(2),
        items: snapshot.map((item) => ({ title: `${item.name}${item.ticket_name ? ` — ${item.ticket_name}` : ""}`, quantity: item.quantity, unit_price: (item.unit_cents / 100).toFixed(2) })),
        payer: { email: user.email },
        external_reference: id,
        description: snapshot.map((item) => item.name).join(", ").slice(0, 250),
        config: { online: { success_url: `${orderUrl}&retorno=sucesso`, pending_url: `${orderUrl}&retorno=pendente`, failure_url: `${orderUrl}&retorno=falha`, auto_return: "approved" }, default_payment_due_date: "P3D", ...(Object.keys(paymentMethod).length ? { payment_method: paymentMethod } : {}) },
      }),
    });
    if (!response.ok) {
      const providerBody = await response.text().catch(() => "");
      let providerError: { error?: unknown; message?: unknown; cause?: unknown } = {};
      try {
        const parsedBody = JSON.parse(providerBody);
        if (parsedBody && typeof parsedBody === "object") providerError = parsedBody;
      } catch { /* O corpo bruto fica restrito ao log de desenvolvimento. */ }
      const causes = Array.isArray(providerError.cause)
        ? providerError.cause.slice(0, 5).map((cause) => {
            if (!cause || typeof cause !== "object") return null;
            const item = cause as Record<string, unknown>;
            return { code: typeof item.code === "string" || typeof item.code === "number" ? item.code : undefined, description: typeof item.description === "string" ? item.description.slice(0, 300) : undefined };
          }).filter(Boolean)
        : undefined;
      console.error("[mercado-pago-checkout] Criação da order recusada", {
        httpStatus: response.status,
        error: typeof providerError.error === "string" ? providerError.error.slice(0, 120) : undefined,
        message: typeof providerError.message === "string" ? providerError.message.slice(0, 300) : undefined,
        causes,
        responseBody: process.env.NODE_ENV === "development"
          ? providerBody.replace(/Bearer\s+\S+/gi, "Bearer [redigido]").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail]").slice(0, 3000)
          : undefined,
      });
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        await db.rpc("ofir_apply_mercado_pago_order_state", {
          p_order_id: id,
          p_payment_status: "rejected",
          p_fulfillment_status: "cancelled",
          p_payment_id: "",
          p_inventory_action: "release",
        });
      }
      return NextResponse.json({ error: "O Mercado Pago não conseguiu criar o checkout. Tente novamente." }, { status: 502, headers: noCache });
    }

    const mercadoPagoOrder = await response.json();
    const paidCents = Math.round(Number(mercadoPagoOrder.total_amount) * 100);
    if (typeof mercadoPagoOrder.id !== "string" || typeof mercadoPagoOrder.checkout_url !== "string"
      || mercadoPagoOrder.external_reference !== id || paidCents !== totalCents) {
      console.error("[mercado-pago-checkout] Resposta divergente do pedido", {
        hasId: typeof mercadoPagoOrder.id === "string",
        hasCheckoutUrl: typeof mercadoPagoOrder.checkout_url === "string",
        referenceMatches: mercadoPagoOrder.external_reference === id,
        amountMatches: paidCents === totalCents,
      });
      throw Error("Resposta inválida do Mercado Pago.");
    }

    const savedProviderOrder = await db.from("customer_orders").update({
      mercado_pago_order_id: mercadoPagoOrder.id,
      checkout_url: mercadoPagoOrder.checkout_url,
    }).eq("id", id);
    if (savedProviderOrder.error) throw Error("O checkout foi criado, mas não foi possível salvar sua referência. Tente novamente.");
    await session.from("customer_cart").delete().eq("user_id", user.id);
    return NextResponse.json({ checkoutUrl: mercadoPagoOrder.checkout_url, orderId: id }, { headers: noCache });
  } catch (error) {
    console.error("[mercado-pago-checkout] Erro ao preparar checkout", {
      message: error instanceof Error ? error.message.slice(0, 300) : "Erro desconhecido",
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível preparar o checkout." }, { status: 409, headers: noCache });
  }
}
