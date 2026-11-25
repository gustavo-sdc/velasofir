import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedPost } from "@/platform/server/blog";
import { Breadcrumb, JsonLd } from "@/platform/components/shell";
import { ArticleBody } from "@/platform/components/article-body";
import { blogSeo } from "@/platform/domain/blog";
import { site } from "@/platform/site";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await publishedPost(slug);
  if (!post)
    return {
      title: "Conteúdo não encontrado",
      robots: { index: false, follow: false },
    };
  const seo = blogSeo(post);
  const url = `${site.url}/conteudos/${post.slug}`;
  return {
    ...seo,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: seo.title,
      description: seo.description,
      url,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: post.cover_image
        ? [{ url: post.cover_image, alt: post.cover_alt }]
        : undefined,
    },
    twitter: {
      card: post.cover_image ? "summary_large_image" : "summary",
      title: seo.title,
      description: seo.description,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await publishedPost(slug);
  if (!post) notFound();
  const url = `${site.url}/conteudos/${post.slug}`;
  const date = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "long",
    });
  return (
    <main className="mx-auto min-h-[60vh] w-[80%] max-w-[90rem] pb-[8vh] pt-[3vh] md:pt-[5vh]">
      <Breadcrumb
        items={[
          { title: "Universo Ofir", href: "/conteudos" },
          { title: post.title },
        ]}
      />
      <article className="w-full">
        <header className="mx-auto max-w-[48rem] pt-5 md:pt-8">
          <span className="mb-3 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">{post.category}</span>
          <h1 className="mb-4 break-words text-[clamp(2.375rem,10vw,4rem)] leading-[1.04] tracking-[-0.06em]">{post.title}</h1>
          <p className="mb-5 text-[0.95rem] leading-7 text-[#555] md:text-[1.0625rem]">{post.excerpt}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-b border-[#e8e5df] pb-4 text-[0.7rem] leading-relaxed text-[#777]">
            <span>Por {post.author_name}</span>
            {post.published_at && (
              <span>
                <span className="text-[#222]">Publicado em </span>
                <time dateTime={post.published_at}>
                  {date(post.published_at)}
                </time>
              </span>
            )}
            {post.updated_at !== post.published_at && (
              <span>
                <span className="text-[#222]">Atualizado em </span>
                <time dateTime={post.updated_at}>{date(post.updated_at)}</time>
              </span>
            )}
          </div>
          {post.cover_image && (
            <img
              className="my-6 aspect-[16/9] max-h-[39rem] w-full rounded-lg bg-[#f2f1ee] object-cover md:my-8"
              src={post.cover_image}
              alt={post.cover_alt}
              fetchPriority="high"
            />
          )}
        </header>
        <div className="mx-auto max-w-[45rem] text-[0.95rem] leading-[1.9] text-[#242424] [&>div>p:first-child]:text-[1.0625rem] [&>div>p:first-child]:text-[#222]">
          <ArticleBody content={post.content} />
        </div>
        <footer className="mx-auto mt-11 flex max-w-[45rem] flex-wrap gap-5 border-t border-[#e8e5df] py-7">
          <Link className="border-b border-[#aaa] pb-1 text-sm underline-offset-4 hover:border-[#171717]" href="/conteudos">
            ← Todos os artigos
          </Link>
          <Link className="border-b border-[#aaa] pb-1 text-sm underline-offset-4 hover:border-[#171717]" href="/loja">
            Conheça as velas Ofir ↗
          </Link>
        </footer>
      </article>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          inLanguage: "pt-BR",
          articleSection: post.category,
          datePublished: post.published_at ?? undefined,
          dateModified: post.updated_at,
          author: {
            "@type": post.author_name === site.name ? "Organization" : "Person",
            name: post.author_name,
            ...(post.author_name === site.name ? { url: site.url } : {}),
          },
          publisher: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          url,
          image: post.cover_image ? [post.cover_image] : undefined,
        }}
      />
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { name: "Início", item: site.url },
            { name: "Universo Ofir", item: `${site.url}/conteudos` },
            { name: post.title, item: url },
          ].map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            ...item,
          })),
        }}
      />
    </main>
  );
}
