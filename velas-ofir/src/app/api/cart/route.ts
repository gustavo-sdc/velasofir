import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionDatabase } from "@/platform/server/supabase";
const lineSchema = z.object({
  kind: z.enum(["product", "workshop"]),
  catalog_id: z.uuid(),
  name: z.string().trim().min(1).max(160),
  ticket_name: z.string().max(100),
  quantity: z.number().int().min(1).max(20),
  unit_cents: z.number().int().positive().max(201000000),
  image: z
    .string()
    .max(2048)
    .refine(
      (value) =>
        (value.startsWith("/") && !value.startsWith("//")) ||
        value.startsWith("https://"),
    )
    .optional(),
});
const noCache = { "Cache-Control": "no-store" };

async function customer() {
  const db = await sessionDatabase();
  if (!db) return null;
  const {
    data: { user },
  } = await db.auth.getUser();
  return user ? { db, user } : null;
}
export async function GET() {
  const session = await customer();
  if (!session)
    return NextResponse.json({ items: [] }, { status: 401, headers: noCache });
  const { data, error } = await session.db
    .from("customer_cart")
    .select("items")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Não foi possível carregar o carrinho." },
      { status: 503, headers: noCache },
    );
  return NextResponse.json({ items: data?.items ?? [] }, { headers: noCache });
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403, headers: noCache },
    );
  const session = await customer();
  if (!session)
    return NextResponse.json(
      { error: "Entre na sua conta para sincronizar." },
      { status: 401, headers: noCache },
    );
  const parsed = z
    .object({ item: lineSchema })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Item inválido." },
      { status: 400, headers: noCache },
    );
  const existing = await session.db
    .from("customer_cart")
    .select("items")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (existing.error)
    return NextResponse.json(
      { error: "Não foi possível atualizar o carrinho." },
      { status: 503, headers: noCache },
    );
  const items = (
    Array.isArray(existing.data?.items) ? existing.data.items : []
  ) as z.infer<typeof lineSchema>[];
  const next = [...items];
  const item = parsed.data.item;
  const match = next.find(
    (line) =>
      line.kind === item.kind &&
      line.catalog_id === item.catalog_id &&
      line.ticket_name === item.ticket_name,
  );
  if (match) {
    match.quantity = Math.min(20, match.quantity + item.quantity);
    match.image ??= item.image;
  } else next.push(item);
  const saved = await session.db.from("customer_cart").upsert({
    user_id: session.user.id,
    items: next.slice(0, 30),
    updated_at: new Date().toISOString(),
  });
  if (saved.error)
    return NextResponse.json(
      { error: "Não foi possível salvar o carrinho." },
      { status: 503, headers: noCache },
    );
  return NextResponse.json({ items: next.slice(0, 30) }, { headers: noCache });
}

export async function PUT(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403, headers: noCache },
    );
  const session = await customer();
  if (!session)
    return NextResponse.json(
      { error: "Entre na sua conta para sincronizar." },
      { status: 401, headers: noCache },
    );
  const parsed = z
    .object({
      kind: z.enum(["product", "workshop"]),
      catalog_id: z.uuid(),
      ticket_name: z.string().max(100),
      quantity: z.number().int().min(1).max(20),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Quantidade inválida." },
      { status: 400, headers: noCache },
    );

  const existing = await session.db
    .from("customer_cart")
    .select("items")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (existing.error)
    return NextResponse.json(
      { error: "Não foi possível carregar a carrinho." },
      { status: 503, headers: noCache },
    );

  const items = (
    Array.isArray(existing.data?.items) ? existing.data.items : []
  ) as z.infer<typeof lineSchema>[];
  const target = parsed.data;
  const match = items.find(
    (item) =>
      item.kind === target.kind &&
      item.catalog_id === target.catalog_id &&
      item.ticket_name === target.ticket_name,
  );
  if (!match)
    return NextResponse.json(
      { error: "Esse item não está mais na carrinho da sua conta." },
      { status: 404, headers: noCache },
    );
  match.quantity = target.quantity;

  const saved = await session.db.from("customer_cart").upsert({
    user_id: session.user.id,
    items,
    updated_at: new Date().toISOString(),
  });
  if (saved.error)
    return NextResponse.json(
      { error: "Não foi possível salvar a quantidade." },
      { status: 503, headers: noCache },
    );
  return NextResponse.json({ items }, { headers: noCache });
}

export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403, headers: noCache },
    );
  const session = await customer();
  if (!session)
    return NextResponse.json(
      { error: "Entre na sua conta." },
      { status: 401, headers: noCache },
    );
  const selector = z
    .object({
      kind: z.enum(["product", "workshop"]),
      catalog_id: z.uuid(),
      ticket_name: z.string().max(100),
    })
    .safeParse(await request.json().catch(() => null));
  if (selector.success) {
    const existing = await session.db
      .from("customer_cart")
      .select("items")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (existing.error)
      return NextResponse.json(
        { error: "Não foi possível atualizar." },
        { status: 503, headers: noCache },
      );
    const items = (
      Array.isArray(existing.data?.items) ? existing.data.items : []
    ).filter(
      (line: { kind: string; catalog_id: string; ticket_name: string }) =>
        !(
          line.kind === selector.data.kind &&
          line.catalog_id === selector.data.catalog_id &&
          line.ticket_name === selector.data.ticket_name
        ),
    );
    const saved = await session.db.from("customer_cart").upsert({
      user_id: session.user.id,
      items,
      updated_at: new Date().toISOString(),
    });
    return saved.error
      ? NextResponse.json(
          { error: "Não foi possível atualizar." },
          { status: 503, headers: noCache },
        )
      : NextResponse.json({ items }, { headers: noCache });
  }
  const { error } = await session.db
    .from("customer_cart")
    .delete()
    .eq("user_id", session.user.id);
  return error
    ? NextResponse.json(
        { error: "Não foi possível limpar." },
        { status: 503, headers: noCache },
      )
    : NextResponse.json({ ok: true }, { headers: noCache });
}
