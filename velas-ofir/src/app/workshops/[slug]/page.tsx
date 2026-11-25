import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { workshops } from "@/platform/server/catalog";
import { Breadcrumb } from "@/platform/components/shell";
import { WorkshopTicketSelector } from "@/platform/components/workshop-ticket-selector";
import { WorkshopImageScroller } from "@/platform/components/workshop-image-scroller";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = (await workshops()).items.find((w) => w.slug === slug);
  return w
    ? {
        title: w.title,
        description: w.description,
        alternates: { canonical: `/workshops/${slug}` },
      }
    : { title: "Workshop não encontrado", robots: { index: false } };
}
export default async function WorkshopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = (await workshops()).items.find((w) => w.slug === slug);
  if (!w) notFound();
  const hasHappened = new Date(w.starts_at).getTime() <= Date.now();
  const images = Array.from(
    new Set(
      [w.image, ...w.images].filter((image): image is string => Boolean(image)),
    ),
  );
  const tickets = w.ticket_types.length
    ? w.ticket_types
    : [
        {
          name: "Ingresso individual",
          description: "",
          price_cents: w.price_cents,
          quantity: Math.max(1, Math.min(20, w.capacity || 20)),
          min_per_order: 1,
          max_per_order: Math.max(1, Math.min(20, w.capacity || 20)),
          sales_start: null,
          sales_end: null,
        },
      ];
  const dateLabel = new Date(w.starts_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "short",
  });
  return (
    <main className="mx-auto min-h-[60vh] w-[80%] max-w-[90rem] pb-[8vh] pt-[3vh] font-[family-name:var(--body-sans)] md:pt-[5vh]">
      <Breadcrumb
        items={[{ title: "Workshops", href: "/workshops" }, { title: w.title }]}
      />
      <section className="mb-8 isolate" aria-labelledby="workshop-title">
        {w.image && (
          <figure className="m-0 aspect-[4/3] w-full overflow-hidden bg-[#f5f5f5] md:aspect-[16/7]">
            <img
              className="size-full object-cover"
              src={w.image}
              alt={`Workshop ${w.title}`}
              fetchPriority="high"
            />
          </figure>
        )}
        <div className={`relative z-10 mx-auto grid w-[92%] grid-cols-1 gap-4 md:mb-[7vh] md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:gap-[5%] ${w.image ? "-mt-[18vw] md:-mt-[10.5vw]" : "mt-5"}`}>
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-[0_0.75rem_2.5rem_rgba(32,32,30,0.12)] sm:p-7 md:rounded-2xl md:p-[clamp(1.75rem,4vw,3.5rem)]">
            <span className="mb-3 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#777]">Uma experiência Ofir</span>
            <h1 className="mb-3 break-words text-[clamp(2.375rem,10vw,3.625rem)] leading-tight tracking-[-0.05em]" id="workshop-title">{w.title}</h1>
            <p className="mb-5 max-w-[34rem] text-sm leading-[1.85] text-[#666]">
              Um encontro para desacelerar, experimentar e criar com as próprias
              mãos.
            </p>
            <div className="mb-6 grid gap-3 md:max-w-[40rem] md:grid-cols-2 md:gap-5">
              <div className="grid gap-1 border-t border-[#e5e5e5] pt-3">
                <span className="text-[0.62rem] uppercase tracking-[0.11em] text-[#555]">Quando</span>
                <strong className="break-words text-xs font-medium leading-relaxed">{dateLabel}</strong>
              </div>
              <div className="grid gap-1 border-t border-[#e5e5e5] pt-3">
                <span className="text-[0.62rem] uppercase tracking-[0.11em] text-[#555]">Onde</span>
                <strong className="break-words text-xs font-medium leading-relaxed">{w.location}</strong>
              </div>
            </div>
            <a
              className="inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-[#171717] px-5 py-3 text-sm text-white transition hover:bg-[#333] md:min-w-[14rem] md:w-auto"
              href={hasHappened ? "#sobre-workshop" : "#reservar"}
            >
              {hasHappened ? "Relembrar a experiência" : "Quero participar"}{" "}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          {hasHappened ? (
            <aside className="self-start rounded-xl bg-gray-100 p-5 shadow-[0_0.5rem_1.75rem_rgba(0,0,0,0.05)] md:sticky md:top-28 md:p-7">
              <span className="mb-2 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#777]">Memórias Ofir</span>
              <h2 className="mb-2 text-2xl">Este workshop já aconteceu.</h2>
              <p className="mb-0 text-sm leading-7 text-[#666]">Confira os detalhes e registros deste encontro especial.</p>
            </aside>
          ) : (
            <aside
              className="self-start rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-[0_0.5rem_1.75rem_rgba(0,0,0,0.08)] md:sticky md:top-28 md:p-7"
              id="reservar"
              aria-label="Escolha seu ingresso"
            >
              <span className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#555]">
                Ingressos
              </span>
              <h2 className="mb-1 text-2xl leading-tight">Garanta seu lugar</h2>
              <p className="mb-5 text-sm leading-6 text-[#666]">
                Escolha o ingresso e a quantidade para este workshop.
              </p>
              <WorkshopTicketSelector
                tickets={tickets}
                workshopId={w.id}
                workshopTitle={w.title}
                image={w.image}
              />
              <p className="mb-0 mt-5 border-t border-[#e5e5e5] pt-4 text-xs leading-5 text-[#666]">
                Dúvidas sobre o workshop? Fale com a Ofir antes de reservar.
              </p>
            </aside>
          )}
        </div>
      </section>
      <section
        id="sobre-workshop"
        className="w-full"
        aria-labelledby="workshop-about-title"
      >
        {w.youtube_videos.length > 0 && (
          <section
            className="mb-10"
            aria-labelledby="workshop-videos-title"
          >
            <h2 className="mb-5 text-3xl" id="workshop-videos-title">Conheça a experiência</h2>
            {w.youtube_videos.map((url, index) => (
              <div className="mb-6" key={url}>
                <iframe
                  className="mb-3 aspect-video w-full rounded-xl bg-black"
                  src={url}
                  title={`Vídeo ${index + 1} — ${w.title}`}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <a
                  className="inline-flex border-b border-[#aaa] pb-1 text-sm underline-offset-4 hover:border-[#171717]"
                  href={`https://www.youtube.com/watch?v=${url.split("/").pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Assistir no YouTube ↗
                </a>
              </div>
            ))}
          </section>
        )}

        <h2 className="mb-4 text-[clamp(1.9rem,8vw,2.65rem)] leading-tight" id="workshop-about-title">Uma pausa para criar</h2>
        <div className="mb-10 max-w-[48rem] whitespace-pre-wrap text-[0.95rem] leading-[1.9] text-[#4e4e4e]">{w.description}</div>

        {images.filter((image) => image !== w.image).length > 0 && (
          <section
            className="my-8 border-t border-[#e5e5e5] py-5"
            aria-labelledby="workshop-gallery-title"
          >
            <div className="mb-4">
              <span className="mb-2 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#777]">Um pouco do que te espera</span>
              <h2 className="mb-0 text-2xl" id="workshop-gallery-title">Detalhes da experiência</h2>
            </div>
            <WorkshopImageScroller
              images={images.filter((image) => image !== w.image)}
              title={w.title}
            />
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 py-2 pb-10 md:grid-cols-2 md:gap-[7%]">
          <section className="border-t border-[#e5e5e5] pt-5">
            <span className="mb-3 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#777]">A experiência</span>
            <h2 className="mb-4 text-2xl">O que vamos criar</h2>
            <ul className="m-0 list-disc pl-5">
              {w.program.map((item) => (
                <li className="mb-2.5 text-sm leading-7 text-[#555]" key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="border-t border-[#e5e5e5] pt-5">
            <span className="mb-3 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#777]">Pensado para você</span>
            <h2 className="mb-4 text-2xl">O que está incluso</h2>
            <ul className="m-0 list-disc pl-5">
              {w.includes.map((item) => (
                <li className="mb-2.5 text-sm leading-7 text-[#555]" key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid items-center gap-5 rounded-xl bg-[#f5f5f5] p-6 sm:p-8 md:grid-cols-[1fr_auto] md:px-10">
          <div>
            <span className="mb-2 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#777]">Seu momento começa aqui</span>
            <h2 className="mb-0 text-[1.7rem]">Vamos criar juntas?</h2>
          </div>
          <a className="inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-[#171717] px-5 py-3 text-sm text-white transition hover:bg-[#333] md:min-w-[15rem] md:w-auto" href="#reservar">
            Escolher meu ingresso <span aria-hidden="true">↑</span>
          </a>
        </div>
      </section>
    </main>
  );
}
