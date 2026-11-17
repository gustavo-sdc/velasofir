import { z } from "zod";
export const orderInput = z
  .object({
    id: z.uuid(),
    kind: z.enum(["product", "workshop"]),
    catalog_id: z.uuid(),
    ticket_name: z.string().max(100).default(""),
    quantity: z.number().int().min(1).max(20),
    customer_name: z.string().trim().min(2).max(160),
    customer_email: z.email().max(254),
    expected_total_cents: z.number().int().positive().max(201000000),
    shipping_cents: z.number().int().min(0).max(1000000),
    delivery_description: z.string().trim().max(1000),
    conditions_confirmed: z.literal(true),
  })
  .superRefine((order, ctx) => {
    if (order.kind === "product" && order.delivery_description.length < 10)
      ctx.addIssue({
        code: "custom",
        message:
          "Informe endereço, modalidade, prazo e frete acordados com a cliente.",
      });
    if (
      order.kind === "workshop" &&
      (order.shipping_cents !== 0 || !order.ticket_name)
    )
      ctx.addIssue({
        code: "custom",
        message: "Selecione o ingresso; workshops presenciais não têm frete.",
      });
  });
export type CommerceOrder = {
  id: string;
  environment: "sandbox" | "production";
  kind: "product" | "workshop";
  customer_name: string;
  customer_email: string;
  catalog_id: string;
  item_name: string;
  ticket_name: string;
  quantity: number;
  unit_cents: number;
  shipping_cents: number;
  total_cents: number;
  delivery_description: string;
  production_days: number;
  ready_quantity: number;
  reservation_active: boolean;
  status: string;
  checkout_id: string | null;
  created_at: string;
  updated_at: string;
};
export const orderStatus: Record<string, string> = {
  reserved: "Reservado",
  creating: "Aguardando vínculo / conciliação",
  pending: "Aguardando pagamento",
  cancel_requested: "Cancelamento solicitado",
  paid: "Pago",
  canceled: "Cancelado",
  expired: "Expirado",
  failed: "Criação recusada",
  review: "Revisão financeira necessária",
};
