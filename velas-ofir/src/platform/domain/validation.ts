import { z } from "zod";
import { youtubeEmbedUrl } from "./youtube.ts";
const slug = z
  .string()
  .min(2)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const image = z.union([
  z.literal(""),
  z.url().refine((url) => url.startsWith("https://"), "Use uma URL HTTPS."),
]);
export const productInput = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug,
    description: z.string().trim().min(10).max(5000),
    collection: z.string().trim().max(100),
    price: z
      .number()
      .positive()
      .max(100000)
      .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-7),
    stock_quantity: z.number().int().min(0).max(100000),
    accepts_orders: z.boolean(),
    production_days: z.number().int().min(1).max(365).nullable(),
    image,
    published: z.boolean(),
  })
  .refine((p) => !p.accepts_orders || p.production_days !== null, {
    message: "Informe o prazo para produtos sob encomenda.",
    path: ["production_days"],
  });
export const productUpdateInput = z
  .object({
    ...productInput.shape,
    slug: z
      .string()
      .min(2)
      .max(220)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .nullable(),
    stock_quantity: z.number().int().min(0).max(100000).nullable(),
  })
  .refine((p) => !p.accepts_orders || p.production_days !== null, {
    message: "Informe o prazo para produtos sob encomenda.",
    path: ["production_days"],
  });
export const ticketTypeInput = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).default(""),
    price_cents: z.number().int().min(0).max(10000000),
    quantity: z.number().int().min(1).max(1000),
    min_per_order: z.number().int().min(1).max(1000),
    max_per_order: z.number().int().min(1).max(1000),
    sales_start: z.iso.datetime({ offset: true }).nullable(),
    sales_end: z.iso.datetime({ offset: true }).nullable(),
  })
  .superRefine((ticket, ctx) => {
    if (
      ticket.min_per_order > ticket.max_per_order ||
      ticket.max_per_order > ticket.quantity
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Os limites por pedido devem respeitar a quantidade do ingresso.",
      });
    if (
      ticket.sales_start &&
      ticket.sales_end &&
      new Date(ticket.sales_start).getTime() >=
        new Date(ticket.sales_end).getTime()
    )
      ctx.addIssue({
        code: "custom",
        message: "O fim da disponibilidade deve ser posterior ao início.",
      });
  });
export type TicketType = z.infer<typeof ticketTypeInput>;
export const workshopInput = z
  .object({
    title: z.string().trim().min(3).max(160),
    slug,
    description: z
      .string()
      .min(20)
      .max(5000)
      .refine(
        (s) => s.trim().length >= 20,
        "Descreva o evento com pelo menos 20 caracteres.",
      ),
    starts_at: z.iso
      .datetime({ offset: true })
      .refine(
        (s) => new Date(s).getTime() > Date.now(),
        "Escolha uma data futura.",
      ),
    location: z.string().trim().min(5).max(500),
    price_cents: z.number().int().min(0).max(10000000),
    capacity: z.number().int().min(1).max(1000),
    includes: z.array(z.string().trim().min(2).max(300)).min(1).max(20),
    program: z.array(z.string().trim().min(2).max(300)).min(1).max(20),
    image,
    images: z.array(image).max(8).default([]),
    youtube_videos: z
      .array(
        z
          .string()
          .trim()
          .max(500)
          .refine(
            (value) => youtubeEmbedUrl(value) !== null,
            "Informe um link HTTPS válido de vídeo do YouTube.",
          )
          .transform((value) => youtubeEmbedUrl(value)!),
      )
      .max(5, "Adicione no máximo cinco vídeos.")
      .default([]),
    ticket_types: z.array(ticketTypeInput).min(1).max(20).optional(),
    published: z.boolean(),
  })
  .superRefine((workshop, ctx) => {
    if (!workshop.ticket_types) return;
    if (
      workshop.ticket_types.reduce((sum, t) => sum + t.quantity, 0) >
      workshop.capacity
    )
      ctx.addIssue({
        code: "custom",
        message: "A soma dos ingressos excede a capacidade da turma.",
      });
    const names = workshop.ticket_types.map((t) =>
      t.name.toLocaleLowerCase("pt-BR"),
    );
    if (new Set(names).size !== names.length)
      ctx.addIssue({
        code: "custom",
        message: "Dê um nome diferente para cada tipo ou lote de ingresso.",
      });
    for (const t of workshop.ticket_types) {
      if (
        [t.sales_start, t.sales_end].some(
          (d) =>
            d && new Date(d).getTime() > new Date(workshop.starts_at).getTime(),
        )
      )
        ctx.addIssue({
          code: "custom",
          message:
            "A disponibilidade dos ingressos não pode ultrapassar o início do evento.",
        });
    }
  });
