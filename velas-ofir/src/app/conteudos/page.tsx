import Link from "next/link";
import { publishedPosts } from "@/platform/server/blog";
import { Breadcrumb } from "@/platform/components/shell";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Inspire-se",
  description:
    "Ideias, histórias e inspiração da Ofir para criar pequenos rituais em casa.",
  alternates: { canonical: "/conteudos" },
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function Content() {
  const { items, available } = await publishedPosts();
  const [featured, ...stories] = items;

  return (
    <main className="mx-auto min-h-[60vh] w-[80%] max-w-[90rem] pb-[8vh] pt-[3vh] md:pt-[5vh]">
      <Breadcrumb items={[{ title: "Inspire-se" }]} />
      <header className="max-w-[43rem] py-6 pb-10 md:py-10 md:pb-14">
        <span className="mb-3 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">O universo Ofir</span>
        <h1 className="mb-3 text-[clamp(3rem,12vw,4.75rem)] tracking-[-0.06em]">Inspire-se.</h1>
        <p className="mb-0 max-w-[30rem] text-[0.95rem] leading-8 text-[#666]">Histórias, ideias e rituais para viver a casa com mais presença.</p>
      </header>

      {featured ? (
        <section aria-labelledby="blog-latest">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="mb-0 text-xl font-semibold tracking-tight" id="blog-latest">Últimas histórias</h2>
            <span className="text-xs text-[#777]">{items.length} {items.length === 1 ? "história" : "histórias"}</span>
          </div>
          <Link
            className="group grid min-w-0 overflow-hidden rounded-2xl bg-[#f4f4f2] transition duration-300 hover:-translate-y-1 hover:shadow-xl md:grid-cols-[1.15fr_1fr]"
            href={`/conteudos/${featured.slug}`}
          >
            {featured.cover_image ? (
              <img
                className="aspect-[16/10] size-full object-cover md:min-h-[19rem]"
                src={featured.cover_image}
                alt={featured.cover_alt}
                fetchPriority="high"
              />
            ) : (
              <div className="grid aspect-[16/10] place-items-center bg-gradient-to-br from-[#e5dfd2] to-[#f6f5f1] text-3xl italic text-[#806745] md:min-h-[19rem]">Ofir</div>
            )}
            <div className="flex flex-col justify-center p-5 sm:p-7 md:p-[clamp(1.5rem,5vw,4rem)]">
              <span className="mb-2 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#777]">{featured.category}</span>
              <h3 className="mb-3 text-[clamp(1.7rem,7vw,3rem)] leading-tight">{featured.title}</h3>
              <p className="mb-5 max-w-[32rem] text-sm leading-7 text-[#666]">{featured.excerpt}</p>
              <span className="flex items-center justify-between gap-3 border-t border-[#dedbd4] pt-3 text-xs text-[#777]">
                {formatDate(featured.published_at) ?? "Leia a história"}
                <span aria-hidden="true">↗</span>
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      {stories.length > 0 && (
        <section className="pt-6 md:pt-10" aria-label="Mais histórias">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {stories.map((post) => (
              <Link
                key={post.id}
                href={`/conteudos/${post.slug}`}
                className="group block min-w-0 overflow-hidden rounded-2xl bg-[#f4f4f2] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {post.cover_image ? (
                  <img
                    className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    src={post.cover_image}
                    alt={post.cover_alt}
                    loading="lazy"
                  />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center bg-gradient-to-br from-[#e5dfd2] to-[#f6f5f1] text-3xl italic text-[#806745]">Ofir</div>
                )}
                <div className="p-4 sm:p-5">
                  <span className="mb-2 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#777]">{post.category}</span>
                  <h3 className="mb-2 text-2xl leading-tight">{post.title}</h3>
                  <p className="mb-4 text-sm leading-7 text-[#666]">{post.excerpt}</p>
                  <span className="flex items-center justify-between gap-3 border-t border-[#dedbd4] pt-3 text-xs text-[#777]">
                    {formatDate(post.published_at) ?? "Leia a história"}
                    <span aria-hidden="true">↗</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!items.length && (
        <p className="my-6 rounded-lg border border-[#e8e5df] bg-[#f7f5f0] p-4 text-sm text-[#555]">
          {available
            ? "Estamos preparando novas histórias. Volte em breve."
            : "Não foi possível carregar os conteúdos agora. Tente novamente em alguns instantes."}
        </p>
      )}
    </main>
  );
}
