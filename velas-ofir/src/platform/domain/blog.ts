import { z } from "zod";
export const blogInput = z
  .object({
    title: z.string().trim().min(3, "Informe o título.").max(180),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(140)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use palavras separadas por hífen no endereço.",
      ),
    excerpt: z.string().trim().max(500),
    content: z.string().max(60000),
    category: z.string().trim().min(2).max(80),
    author_name: z.string().trim().min(2).max(120),
    cover_image: z.union([
      z.literal(""),
      z.url().refine((value) => value.startsWith("https://")),
    ]),
    cover_alt: z.string().trim().max(250),
    seo_title: z.string().trim().max(120),
    seo_description: z.string().trim().max(320),
    published: z.boolean(),
  })
  .superRefine((post, ctx) => {
    if (!post.published) return;
    if (post.excerpt.length < 30)
      ctx.addIssue({
        code: "custom",
        path: ["excerpt"],
        message:
          "Escreva um resumo de pelo menos 30 caracteres antes de publicar.",
      });
    if (post.content.trim().length < 100)
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message:
          "Escreva o conteúdo do artigo antes de publicar (mínimo de 100 caracteres).",
      });
    if (post.cover_image && post.cover_alt.length < 3)
      ctx.addIssue({
        code: "custom",
        path: ["cover_alt"],
        message: "Descreva a imagem de capa para publicar.",
      });
  });
export type BlogInput = z.infer<typeof blogInput>;
export type BlogPost = BlogInput & {
  id: string;
  published_at: string | null;
  updated_at: string;
  created_at: string;
};
export function blogSeo(post: BlogInput) {
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
  };
}
