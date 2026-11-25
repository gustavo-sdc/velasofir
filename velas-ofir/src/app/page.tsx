import Link from "next/link";
import { ArrowUpRight, Flame, Package, Heart } from "lucide-react";
import { publishedPosts } from "@/platform/server/blog";
import { homeMedia } from "@/platform/server/site-media";

export const metadata = { alternates: { canonical: "/" } };
export const dynamic = "force-dynamic";

export default async function Home() {
  const blog = await publishedPosts();
  const media = homeMedia();

  return (
    <>
      <section className="mx-auto grid w-[80%] max-w-[90rem] grid-cols-1 items-center gap-4 py-8 md:min-h-[40rem] md:grid-cols-[1fr_1.08fr] md:gap-[7%] md:py-[2rem] sm:py-[4rem]">
        <div className="flex flex-col items-start">
          <span className="eyebrow">OFIR · AROMAS PERFEITOS</span>
          <h1 className="my-5 text-[clamp(4rem,11vw,9rem)] leading-[0.86] tracking-[-0.075em] md:my-7">
            OFIR.
          </h1>
          <p className="mb-7 max-w-[34rem] text-[1rem] leading-[1.7] text-[#66645f] md:text-[1.125rem]">
            Aromas que acolhem. Criações que encantam. Um convite para
            desacelerar e transformar o simples em especial.
          </p>
          <div className="hero-actions">
            <Link href="/loja" className="button">
              Descubra seu aroma <ArrowUpRight size={17} />
            </Link>
            <Link href="/workshops" className="text-link">
              Viva uma experiência ↗
            </Link>
          </div>
          <span className="mt-8 text-[0.58rem] tracking-[0.2em] text-[#8c877e]">
            OFIR · TESOUROS EM FORMATO DE VELAS
          </span>
        </div>

        <div className="relative mx-auto aspect-[0.95] w-full max-w-[47rem] md:aspect-[1.08]">
          <div className="absolute inset-[0_8%_8%_0] overflow-hidden rounded-[1.5rem] bg-[#e8e3d9]">
            {media.hero && (
              <img
                className="size-full object-cover"
                src={media.hero}
                alt="Universo Ofir"
                fetchPriority="high"
              />
            )}
          </div>
          <span className="absolute right-[3%] top-[5%] flex size-[6.5rem] flex-col items-center justify-center rounded-full bg-[#f3eee4] text-center text-[0.8rem] tracking-[0.12em] shadow-lg md:right-[7%] md:top-[9%] md:size-[8rem]">
            OFIR.
            <small className="mt-1 text-[0.48rem] leading-[1.5] tracking-[0.12em]">
              FEITO À MÃO
              <br />
              COM AFETO
            </small>
          </span>
          {media.detail && (
            <div className="absolute bottom-[8%] right-0 w-[42%] overflow-hidden rounded-[1rem] border-[0.4rem] border-[#faf9f6] bg-[#faf9f6] shadow-xl md:bottom-[10%]">
              <img
                className="aspect-[0.88] w-full rounded-[0.65rem] object-cover"
                src={media.detail}
                alt="Detalhes da Ofir"
              />
              <span className="block px-1 py-2 text-[0.7rem]">
                Detalhes que fazem sentir.
              </span>
            </div>
          )}
          <span className="absolute bottom-[2%] left-[2%] text-[0.55rem] tracking-[0.19em] text-[#777168]">
            AROMAS PERFEITOS.
          </span>
        </div>
      </section>

      <div className="mx-auto flex w-[80%] max-w-[90rem] flex-col gap-4 border-y border-[#e8e4dc] py-5 text-[0.8rem] text-[#69665f] sm:flex-row sm:items-center sm:justify-between sm:gap-3 md:py-6">
        <span className="flex items-center gap-2">
          <Flame size={18} />
          Produção artesanal
        </span>
        <span className="flex items-center gap-2">
          <Package size={18} />
          Pronta entrega e encomendas
        </span>
        <span className="flex items-center gap-2">
          <Heart size={18} />
          Cuidado em cada detalhe
        </span>
      </div>

      <section className="mx-auto w-[80%] max-w-[90rem] py-6 md:py-24">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:mb-9 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">Escolhas que acolhem</span>
            <h2 className="mt-2 text-[clamp(2rem,5vw,4.1rem)] leading-[1.05] tracking-[-0.055em]">
              Sua casa, com mais presença.
            </h2>
          </div>
          <Link className="text-link" href="/loja">
            Explore a loja <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <Link
            href="/loja"
            className="group relative flex min-h-[12em] flex-col justify-between overflow-hidden rounded-[1.25rem] bg-[#e5e0d7] p-6 md:min-h-[16rem] md:p-9"
          >
            <div className="relative z-10">
              <span className="eyebrow">Fragrâncias para ficar</span>
              <h3 className="my-4 text-[clamp(1.8rem,4vw,3.5rem)] leading-[1.05] tracking-[-0.05em]">
                Os pequenos
                <br />
                hábitos da casa.
              </h3>
              <span className="text-link">
                Conheça as velas <ArrowUpRight size={16} />
              </span>
            </div>
            {media.collection && (
              <img
                className="absolute inset-0 size-full object-cover opacity-75 transition-transform duration-900 group-hover:scale-[1.04]"
                src={media.collection}
                alt="Velas Ofir"
                loading="lazy"
              />
            )}
          </Link>
          <Link
            href="/loja"
            className="group relative flex min-h-[12rem] flex-col justify-between overflow-hidden rounded-[1.25rem] bg-[#eee0d9] p-6 md:min-h-[16rem] md:p-9"
          >
            <div className="relative z-10">
              <span className="eyebrow">Feito para encantar</span>
              <h3 className="my-4 text-[clamp(1.8rem,4vw,3.5rem)] leading-[1.05] tracking-[-0.05em]">
                Um presente.
                <br />
                Muitas sensações.
              </h3>
              <span className="text-link">
                Descubra a Ofir <ArrowUpRight size={16} />
              </span>
            </div>
          {media.gift && (
            <img
              className="absolute inset-0 size-full object-cover object-top opacity-75 transition-transform duration-900 group-hover:scale-[1.04]"
              src={media.gift}
              alt="Presentes Ofir"
              loading="lazy"
            />
          )}
          </Link>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#242420] py-14 text-[#faf8f2] md:py-24">
        {media.workshopVideo && (
          <div className="pointer-events-none absolute inset-0 opacity-25 md:inset-y-0 md:left-1/2 md:opacity-90">
            <video
              className="size-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            >
              <source src={media.workshopVideo} type="video/mp4" />
            </video>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#242420] via-[#242420]/85 to-transparent" />
        <div className="relative z-10 mx-auto w-[80%] max-w-[90rem]">
          <span className="eyebrow text-[#f5eee2]!">Experiências Ofir</span>
          <h2 className="my-5 text-[clamp(2.8rem,7vw,6rem)] leading-[0.98] tracking-[-0.06em]">
            Você foi criada
            <br />
            <em className="text-white!">para criar.</em>
          </h2>
          <p className="mb-7 max-w-[32rem] text-[1rem] leading-[1.7] text-white/85!">
            Conheça os workshops presenciais da Ofir e descubra o prazer de
            transformar uma ideia em algo seu.
          </p>
          <Link className="button light" href="/workshops">
            Conheça a experiência <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <section className="mx-auto w-[80%] max-w-[90rem] py-12 md:py-24">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:mb-9 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">Universo Ofir</span>
            <h2 className="mt-2 text-[clamp(2rem,5vw,4.1rem)] leading-[1.05] tracking-[-0.055em]">
              Um pouco de inspiração.
            </h2>
          </div>
          <Link className="text-link" href="/conteudos">
            Explore os guias <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
          {blog.items.slice(0, 2).map((post) => (
            <Link
              key={post.id}
              href={`/conteudos/${post.slug}`}
              className="group border-t border-[#d9d4ca] pt-4"
            >
              <div className="mb-4 aspect-[1.6] overflow-hidden rounded-[1rem] bg-[#eeeae2]">
                {post.cover_image && (
                  <img
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    src={post.cover_image}
                    alt={post.cover_alt}
                    loading="lazy"
                  />
                )}
              </div>
              <span className="eyebrow">{post.category}</span>
              <h3 className="my-2 text-[1.4rem] leading-tight tracking-[-0.03em] md:text-[1.8rem]">
                {post.title}
              </h3>
              <p className="text-[0.95rem] leading-[1.6] text-[#706d66]">
                {post.excerpt}
              </p>
              <ArrowUpRight className="mt-3" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-[80%] max-w-[90rem] flex-col items-start border-t border-[#e8e4dc] py-12 md:py-20">
        <span className="eyebrow">A ESSÊNCIA DA OFIR</span>
        <p className="my-5 text-[clamp(2rem,5vw,4.25rem)] leading-[1.08] tracking-[-0.055em]">
          Mais do que perfumar um ambiente.
          <br />
          <em>É sobre como você se sente nele.</em>
        </p>
        <Link href="/sobre" className="text-link">
          Conheça a nossa história <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}
