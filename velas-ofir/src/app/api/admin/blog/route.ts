import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/platform/server/staff";
import { blogInput } from "@/platform/domain/blog";
import { z } from "zod";
export async function POST(request: Request) {
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
    if (Buffer.byteLength(raw) > 250000)
      return NextResponse.json(
        { error: "Artigo muito grande." },
        { status: 413 },
      );
    const body = JSON.parse(raw);
    const id = body.id;
    if (request.method === "PUT" && !z.uuid().safeParse(id).success)
      return NextResponse.json({ error: "Artigo inválido." }, { status: 400 });
    if (request.method === "PUT") {
      const existing = await session.db
        .from("blog_posts")
        .select("slug")
        .eq("id", id)
        .maybeSingle();
      if (existing.error || !existing.data)
        return NextResponse.json(
          { error: "Artigo não encontrado." },
          { status: 404 },
        );
      if (!body.data || typeof body.data !== "object")
        return NextResponse.json(
          { error: "Dados inválidos." },
          { status: 400 },
        );
      body.data.slug = existing.data.slug;
    }
    const parsed = blogInput.safeParse(body.data);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Confira os dados." },
        { status: 400 },
      );
    const query =
      request.method === "PUT"
        ? session.db.from("blog_posts").update(parsed.data).eq("id", id)
        : session.db.from("blog_posts").insert(parsed.data);
    const { data, error } = await query.select("id,slug,published").single();
    if (error)
      return NextResponse.json(
        {
          error:
            error.code === "23505"
              ? "Esse endereço já está em uso. Escolha outro."
              : "Não foi possível salvar o artigo. Tente novamente.",
        },
        { status: 409 },
      );
    revalidatePath("/");
    revalidatePath("/conteudos");
    revalidatePath(`/conteudos/${data.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin");
    return NextResponse.json({ ok: true, post: data });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar o artigo." },
      { status: 400 },
    );
  }
}
export const PUT = POST;
