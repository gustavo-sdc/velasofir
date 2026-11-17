import "server-only";
import { cache } from "react";
import { publicDatabase } from "./supabase";
import type { BlogPost } from "../domain/blog";
export const publishedPosts = cache(async () => {
  const db = publicDatabase();
  if (!db) return { items: [] as BlogPost[], available: false };
  try {
    const items: BlogPost[] = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await db
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .order("id")
        .range(start, start + 999);
      if (error) throw error;
      items.push(...(data as BlogPost[]));
      if (data.length < 1000) break;
    }
    return { items, available: true };
  } catch {
    return { items: [] as BlogPost[], available: false };
  }
});
export const publishedPost = cache(async (slug: string) => {
  const db = publicDatabase();
  if (!db) return null;
  const { data, error } = await db
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  return error ? null : (data as BlogPost | null);
});
