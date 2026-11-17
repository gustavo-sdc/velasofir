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
    <div className="container page-content">
      <Breadcrumb
        items={[
          { title: "Universo Ofir", href: "/conteudos" },
          { title: post.title },
        ]}
      />
      <article className="article">
        <header>
          <span className="eyebrow">{post.category}</span>
          <h1>{post.title}</h1>
          <p className="lead">{post.excerpt}</p>
          <div className="byline">
            <span>Por {post.author_name}</span>
            {post.published_at && (
              <span>
                Publicado em{" "}
                <time dateTime={post.published_at}>
                  {date(post.published_at)}
                </time>
              </span>
            )}
            {post.updated_at !== post.published_at && (
              <span>
                Atualizado em{" "}
                <time dateTime={post.updated_at}>{date(post.updated_at)}</time>
              </span>
            )}
          </div>
          {post.cover_image && (
            <img
              className="blog-cover-image"
              src={post.cover_image}
              alt={post.cover_alt}
              fetchPriority="high"
            />
          )}
        </header>
        <ArticleBody content={post.content} />
        <footer className="blog-article-footer">
          <Link className="text-link" href="/conteudos">
            ← Todos os artigos
          </Link>
          <Link className="text-link" href="/loja">
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
    </div>
  );
}
