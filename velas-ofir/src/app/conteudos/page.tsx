import Link from "next/link";
import { publishedPosts } from "@/platform/server/blog";
import { Breadcrumb } from "@/platform/components/shell";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Universo Ofir",
  description:
    "Guias e inspiração sobre velas artesanais, fragrâncias e cuidados com a sua casa.",
  alternates: { canonical: "/conteudos" },
};
export default async function Content() {
  const { items, available } = await publishedPosts();
  return (
    <div className="container page-content">
      <Breadcrumb items={[{ title: "Universo Ofir" }]} />
      <div className="page-heading">
        <span className="eyebrow">Ideias para sentir, criar e cuidar</span>
        <h1>
          Universo <em>Ofir.</em>
        </h1>
        <p>Conhecimento e inspiração para os pequenos rituais da sua casa.</p>
      </div>
      <div className="editorial-grid">
        {items.map((post) => (
          <Link
            key={post.id}
            href={`/conteudos/${post.slug}`}
            className="editorial-card"
          >
            {post.cover_image && (
              <img
                className="blog-card-image"
                src={post.cover_image}
                alt={post.cover_alt}
                loading="lazy"
              />
            )}
            <span className="eyebrow">{post.category}</span>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <span className="text-link">Ler o artigo ↗</span>
          </Link>
        ))}
      </div>
      {!items.length && (
        <p className="notice">
          {available
            ? "Estamos preparando novos conteúdos. Volte em breve."
            : "Não foi possível carregar os artigos agora. Tente novamente em alguns instantes."}
        </p>
      )}
    </div>
  );
}
