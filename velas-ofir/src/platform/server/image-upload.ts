import "server-only";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireStaff } from "@/platform/server/staff";
const MAX = 5 * 1024 * 1024;
export async function uploadImage(
  request: Request,
  bucketName: "product-media" | "workshop-media" | "blog-media",
) {
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
  if (Number(request.headers.get("content-length")) > MAX + 65536)
    return NextResponse.json(
      { error: "Use uma imagem de até 5 MB." },
      { status: 413 },
    );
  try {
    const file = (await request.formData()).get("file");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > MAX ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      return NextResponse.json(
        { error: "Envie JPG, PNG ou WebP de até 5 MB." },
        { status: 400 },
      );
    const input = Buffer.from(await file.arrayBuffer());
    const processor = sharp(input, {
      limitInputPixels: 40000000,
      animated: false,
    });
    const meta = await processor.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format ?? ""))
      throw Error("format");
    const buffer = await processor
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
    const path = `${session.user.id}/${crypto.randomUUID()}.webp`;
    const bucket = session.db.storage.from(bucketName);
    const { error } = await bucket.upload(path, buffer, {
      contentType: "image/webp",
      upsert: false,
    });
    if (error)
      return NextResponse.json(
        {
          error:
            "Não foi possível enviar a imagem. Confira a conexão e tente novamente.",
        },
        { status: 409 },
      );
    return NextResponse.json({ url: bucket.getPublicUrl(path).data.publicUrl });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível processar a imagem. Use JPG, PNG ou WebP válido.",
      },
      { status: 400 },
    );
  }
}
