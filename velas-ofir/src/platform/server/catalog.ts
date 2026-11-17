import "server-only";
import { publicDatabase } from "./supabase";
import { cached } from "./redis";
import { slugify } from "../site";
import { availability, type Availability } from "../domain/commerce";
import { ticketTypeInput, type TicketType } from "../domain/validation";
import { youtubeEmbedUrl } from "../domain/youtube";
export interface Product {
  id: string;
  slug: string;
  name: string;
  collection: string;
  description: string;
  price: number;
  image: string | null;
  availability: Availability;
  productionDays: number | null;
  material: string;
  size: string;
  burnTime: string;
}
export interface Workshop {
  youtube_videos: string[];
  images: string[];
  ticket_types: TicketType[];
  id: string;
  slug: string;
  title: string;
  description: string;
  starts_at: string;
  location: string;
  price_cents: number;
  capacity: number;
  image: string | null;
  includes: string[];
  program: string[];
}
export type CatalogResult<T> = {
  items: T[];
  state: "ready" | "unconfigured" | "unavailable";
};
function imageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
export async function products(): Promise<CatalogResult<Product>> {
  const db = publicDatabase();
  if (!db) return { items: [], state: "unconfigured" };
  try {
    const items = await cached("products", async () => {
      const { data, error } = await db
        .from("products")
        .select("*")
        .order("order");
      if (error) throw error;
      return (data ?? [])
        .filter((p) => p.kind !== "colecao" && p.published !== false)
        .map((p) => ({
          id: String(p.id),
          slug: p.slug || `${slugify(String(p.name))}-${p.id}`,
          name: String(p.name),
          collection: String(p.collection ?? ""),
          description: String(p.description ?? ""),
          price: Number(p.price),
          image: imageUrl(p.image),
          availability:
            typeof p.stock_quantity === "number"
              ? availability(p.stock_quantity, p.accepts_orders === true)
              : p.status === "encomenda"
                ? ("made_to_order" as const)
                : ("ready" as const),
          productionDays: p.production_days ?? null,
          material: p.materia_prima ?? "",
          size: p.tamanho ?? "",
          burnTime: p.queima ?? "",
        }))
        .filter((p) => Number.isFinite(p.price) && p.price >= 0);
    });
    return { items, state: "ready" };
  } catch {
    return { items: [], state: "unavailable" };
  }
}
export async function workshops(): Promise<CatalogResult<Workshop>> {
  const db = publicDatabase();
  if (!db) return { items: [], state: "unconfigured" };
  try {
    const items = await cached(
      "workshops",
      async () => {
        const { data, error } = await db
          .from("workshops")
          .select(
            "id,slug,title,description,starts_at,location,price_cents,capacity,image,images,youtube_videos,ticket_types,includes,program",
          )
          .eq("published", true)
          .gt("starts_at", new Date().toISOString())
          .order("starts_at");
        if (error) throw error;
        return (data ?? []).map((w) => ({
          ...w,
          image: imageUrl(w.image),
          youtube_videos: (Array.isArray(w.youtube_videos)
            ? w.youtube_videos
            : []
          ).flatMap((value: unknown) => {
            const url =
              typeof value === "string" ? youtubeEmbedUrl(value) : null;
            return url ? [url] : [];
          }),
          images: (Array.isArray(w.images) ? w.images : [])
            .map(imageUrl)
            .filter((url): url is string => Boolean(url)),
          ticket_types: (Array.isArray(w.ticket_types)
            ? w.ticket_types
            : []
          ).flatMap((t) => {
            const parsed = ticketTypeInput.safeParse(t);
            return parsed.success ? [parsed.data] : [];
          }),
        })) as Workshop[];
      },
      60,
    );
    return { items, state: "ready" };
  } catch {
    return { items: [], state: "unavailable" };
  }
}
