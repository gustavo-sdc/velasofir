import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/platform/server/staff";
import {
  productInput,
  productUpdateInput,
  workshopInput,
} from "@/platform/domain/validation";
import { redisClient } from "@/platform/server/redis";
import { slugify } from "@/platform/site";
import { z } from "zod";

export async function POST(request: Request) {
  // Bloqueia submissões entre sites; autorização e MFA são revalidados em toda operação.
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403 },
    );
  let session;
  try {
    session = await requireStaff(["owner", "admin", "editor"]);
  } catch {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 },
    );
  }
  if (Number(request.headers.get("content-length")) > 20000)
    return NextResponse.json(
      { error: "Cadastro muito grande." },
      { status: 413 },
    );
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 20000)
      return NextResponse.json(
        { error: "Cadastro muito grande." },
        { status: 413 },
      );
    const body = JSON.parse(raw);
    let workshopId: string | null = null;
    let productId: string | null = null;
    let originalProduct: { status: string; kind: string } | null = null;
    if (request.method === "PUT") {
      if (
        !["product", "workshop"].includes(body.kind) ||
        !z.uuid().safeParse(body.id).success
      )
        return NextResponse.json(
          { error: "Cadastro inválido." },
          { status: 400 },
        );
      const existing =
        body.kind === "product"
          ? await session.db
              .from("products")
              .select("id,slug,status,kind,name")
              .eq("id", body.id)
              .maybeSingle()
          : await session.db
              .from("workshops")
              .select("id,slug")
              .eq("id", body.id)
              .maybeSingle();
      if (existing.error || !existing.data)
        return NextResponse.json(
          { error: "Cadastro não encontrado." },
          { status: 404 },
        );
      if (body.kind === "product") {
        productId = body.id;
        originalProduct = existing.data as unknown as {
          status: string;
          kind: string;
        };
      } else workshopId = body.id;
      if (!body.data || typeof body.data !== "object")
        return NextResponse.json(
          { error: "Dados inválidos." },
          { status: 400 },
        );
      body.data.slug =
        existing.data.slug ??
        ("name" in existing.data
          ? `${slugify(String(existing.data.name))}-${body.id}`
          : null);
    }
    if (
      body.kind === "workshop" &&
      body.data &&
      typeof body.data.title === "string"
    ) {
      if (!workshopId)
        body.data.slug = `${slugify(body.data.title).slice(0, 95).replace(/-$/, "") || "workshop"}-${crypto.randomUUID()}`;
      if (
        Array.isArray(body.data.ticket_types) &&
        body.data.ticket_types.length
      )
        body.data.price_cents = Math.min(
          ...body.data.ticket_types.map(
            (t: { price_cents: number }) => t.price_cents,
          ),
        );
    }
    const schema =
      body.kind === "product"
        ? productId
          ? productUpdateInput
          : productInput
        : body.kind === "workshop"
          ? workshopInput
          : null;
    if (!schema)
      return NextResponse.json(
        { error: "Tipo de cadastro inválido." },
        { status: 400 },
      );
    const validated = schema.safeParse(body.data);
    if (!validated.success)
      return NextResponse.json(
        { error: validated.error.issues[0]?.message ?? "Confira os dados." },
        { status: 400 },
      );
    const table = body.kind === "product" ? "products" : "workshops";
    const row: Record<string, unknown> =
      body.kind === "product"
        ? {
            ...validated.data,
            status:
              (validated.data as { stock_quantity: number | null })
                .stock_quantity === null
                ? (originalProduct?.status ?? "disponivel")
                : (validated.data as { stock_quantity: number })
                      .stock_quantity > 0
                  ? "disponivel"
                  : "encomenda",
            kind: originalProduct?.kind ?? "produto",
          }
        : validated.data;
    const { error } = workshopId
      ? await session.db.from("workshops").update(row).eq("id", workshopId)
      : productId
        ? await session.db
            .from("products")
            .update(row)
            .eq("id", productId)
            .select("id")
            .single()
        : await session.db.from(table).insert(row);
    if (error)
      return NextResponse.json(
        {
          error:
            error.code === "23505"
              ? "Esse endereço de página já está em uso."
              : "Não foi possível salvar. Confira a configuração do banco e suas permissões.",
        },
        { status: 409 },
      );
    const redis = redisClient();
    if (redis) {
      try {
        await redis.del(`ofir:v1:${table}`);
      } catch {
        /* O cache público expira em até dois minutos. */
      }
    }
    revalidatePath("/", "layout");
    return NextResponse.json({
      ok: true,
      path: body.kind === "workshop" ? `/workshops/${row.slug}` : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar o cadastro." },
      { status: 400 },
    );
  }
}

export const PUT = POST;

export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403 },
    );
  let session;
  try {
    session = await requireStaff(["owner", "admin", "editor"]);
  } catch {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 },
    );
  }
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 2000)
      return NextResponse.json(
        { error: "Dados muito grandes." },
        { status: 413 },
      );
    const parsed = z
      .union([
        z.object({
          id: z.uuid(),
          stock_quantity: z.number().int().min(0).max(100000),
        }),
        z.object({
          id: z.uuid(),
          kind: z.enum(["product", "workshop"]),
          published: z.boolean(),
        }),
      ])
      .safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Confira a quantidade de estoque." },
        { status: 400 },
      );
    const table =
      "kind" in parsed.data && parsed.data.kind === "workshop"
        ? "workshops"
        : "products";
    const changes =
      "stock_quantity" in parsed.data
        ? { stock_quantity: parsed.data.stock_quantity }
        : { published: parsed.data.published };
    const { data, error } = await session.db
      .from(table)
      .update(changes)
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();
    if (error || !data)
      return NextResponse.json(
        { error: "Não foi possível atualizar o produto." },
        { status: 409 },
      );
    const redis = redisClient();
    if (redis) {
      try {
        await redis.del(`ofir:v1:${table}`);
      } catch {}
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
}
