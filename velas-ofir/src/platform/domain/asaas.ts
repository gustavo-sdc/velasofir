import { z } from "zod";
const checkoutOrder = z.object({
  id: z.uuid(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(160),
        quantity: z.number().int().min(1).max(20),
        unitCents: z.number().int().positive().max(10000000),
      }),
    )
    .min(1)
    .max(30),
});
export type VerifiedOrder = z.infer<typeof checkoutOrder>;

// Somente o servidor deve montar este pedido a partir de preços e reservas no banco.
export function checkoutPayload(order: VerifiedOrder, returnOrigin: string) {
  const valid = checkoutOrder.parse(order);
  const origin = new URL(returnOrigin);
  if (
    origin.protocol !== "https:" &&
    !(
      origin.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(origin.hostname)
    )
  )
    throw new Error("URL de retorno inválida.");
  return {
    billingTypes: ["PIX", "CREDIT_CARD"],
    chargeTypes: ["DETACHED"],
    minutesToExpire: 15,
    externalReference: valid.id,
    callback: {
      successUrl: `${origin.origin}/compra/retorno?pedido=${valid.id}`,
      cancelUrl: `${origin.origin}/esta-indo-embora?pedido=${valid.id}`,
      expiredUrl: `${origin.origin}/compra/expirada?pedido=${valid.id}`,
    },
    items: valid.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      value: i.unitCents / 100,
    })),
  };
}
const webhook = z.object({
  id: z.string().min(1).max(200),
  event: z.enum([
    "CHECKOUT_CREATED",
    "CHECKOUT_PAID",
    "CHECKOUT_CANCELED",
    "CHECKOUT_EXPIRED",
  ]),
  checkout: z.object({
    id: z.string().min(1).max(200),
    status: z.string().max(100),
    externalReference: z.string().max(200).optional(),
    callback: z.object({ successUrl: z.string().max(2000) }).optional(),
    items: z
      .array(
        z.object({
          quantity: z.number().int().positive().max(1000),
          value: z.number().nonnegative().max(10000000),
        }),
      )
      .max(100)
      .optional(),
  }),
});
export function checkoutEvent(value: unknown) {
  return webhook.parse(value);
}
export function checkoutEventAmount(
  items: { quantity: number; value: number }[] | undefined,
): number | null {
  if (!items?.length) return null;
  let total = 0;
  for (const item of items) {
    const cents = Math.round(item.value * 100);
    if (Math.abs(item.value * 100 - cents) > 1e-6) return null;
    total += cents * item.quantity;
  }
  return Number.isSafeInteger(total) && total <= 2147483647 ? total : null;
}
export function eventOrderReference(
  checkout: { externalReference?: string; callback?: { successUrl: string } },
  origin: string,
): string | null {
  if (
    checkout.externalReference &&
    z.uuid().safeParse(checkout.externalReference).success
  )
    return checkout.externalReference;
  try {
    const url = new URL(checkout.callback?.successUrl ?? "");
    const id = url.searchParams.get("pedido");
    return url.origin === new URL(origin).origin &&
      url.pathname === "/compra/retorno" &&
      z.uuid().safeParse(id).success
      ? id
      : null;
  } catch {
    return null;
  }
}
export function checkoutUrl(id: string, environment: "sandbox" | "production") {
  if (!id || id.length > 200) throw new Error("Checkout inválido.");
  return `https://${environment === "sandbox" ? "sandbox." : ""}asaas.com/checkoutSession/show?id=${encodeURIComponent(id)}`;
}
