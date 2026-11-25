import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

// Arquivos em public/media ficam disponíveis diretamente em /media.
function localMedia(folder: string, name: string, extensions: string[]) {
  for (const extension of extensions) {
    const url = `/media/${folder}/${name}.${extension}`;
    if (existsSync(path.join(process.cwd(), "public", url))) return url;
  }
  return null;
}

export function homeMedia() {
  const image = (name: string) =>
    localMedia("images", name, ["webp", "jpg", "jpeg", "png"]);
  return {
    hero: image("home-principal"),
    detail: image("home-detalhe"),
    collection: image("home-colecao"),
    gift: image("home-presente"),
    workshopVideo: "/media/videos/workshop.mp4",
  };
}
