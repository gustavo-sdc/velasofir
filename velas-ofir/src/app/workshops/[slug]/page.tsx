import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { workshops } from "@/platform/server/catalog";
import { Breadcrumb } from "@/platform/components/shell";
import { money, site } from "@/platform/site";
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
  return (
    <div className="container page-content">
      <Breadcrumb
        items={[{ title: "Workshops", href: "/workshops" }, { title: w.title }]}
      />
      <section className={`workshop-hero${w.image ? " workshop-hero--with-cover" : ""}`} aria-labelledby="workshop-title">
        {w.image && (
          <figure className="workshop-cover">
            <img
              className="event-image"
              src={w.image}
              alt={`Conheça o workshop ${w.title}`}
            />
          </figure>
        )}

        <div className="workshop-hero-grid">
          <div className="workshop-hero-copy">
            <span className="eyebrow">Experiência presencial Ofir</span>
            <h1 id="workshop-title">{w.title}</h1>
            <p>
              {new Date(w.starts_at).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
            <p>{w.location}</p>

            <a className="text-link" href="#sobre-workshop">
              Conheça os detalhes da experiência ↓
            </a>
          </div>
          <aside className="booking-card">
            <span className="eyebrow">Seu próximo encontro</span>
            <h2>Ingressos</h2>
            {(w.ticket_types.length
              ? w.ticket_types
              : [
                  {
                    name: "Ingresso individual",
                    description: "",
                    price_cents: w.price_cents,
                    sales_start: null,
                    sales_end: null,
                  },
                ]
            ).map((ticket, index) => {
              const now = Date.now();
              const upcoming =
                ticket.sales_start &&
                new Date(ticket.sales_start).getTime() > now;
              const closed =
                ticket.sales_end && new Date(ticket.sales_end).getTime() < now;
              return (
                <div className="workshop-ticket" key={index}>
                  <strong>{ticket.name}</strong>
                  <span>
                    {ticket.price_cents === 0
                      ? "Gratuito"
                      : money(ticket.price_cents / 100)}
                  </span>
                  {ticket.description && (
                    <p className="workshop-description small">
                      {ticket.description}
                    </p>
                  )}
                  {(upcoming || closed) && (
                    <small>
                      {upcoming
                        ? `Disponível a partir de ${new Date(ticket.sales_start!).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
                        : "Período de disponibilidade encerrado"}
                    </small>
                  )}
                </div>
              );
            })}
            <a
              className="button"
              href={`${site.whatsapp}?text=${encodeURIComponent(`Olá! Quero saber sobre o workshop ${w.title}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar inscrição ↗
            </a>
            <p className="small">
              Inscrições online em preparação. Nossa equipe confirma
              disponibilidade e condições antes da compra.
            </p>
          </aside>
        </div>
      </section>
      <section
        id="sobre-workshop"
        className="workshop-body"
        aria-labelledby="workshop-about-title"
      >
        <h2 id="workshop-about-title">Sobre a experiência</h2>
        <div className="lead workshop-description">{w.description}</div>
        {w.images.filter((url) => url !== w.image).length > 0 && (
          <section
            aria-label="Galeria do workshop"
            className="workshop-gallery"
          >
            {w.images
              .filter((url) => url !== w.image)
              .map((url) => (
                <a
                  href={url}
                  key={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir foto do workshop ${w.title} em tamanho completo`}
                >
                  <img
                    key={url}
                    src={url}
                    alt={`Detalhe do workshop ${w.title}`}
                    loading="lazy"
                  />
                </a>
              ))}
          </section>
        )}
        {w.youtube_videos.length > 0 && (
          <section
            className="workshop-videos"
            aria-labelledby="workshop-videos-title"
          >
            <h2 id="workshop-videos-title">Conheça a experiência</h2>
            {w.youtube_videos.map((url, index) => (
              <div className="workshop-video" key={url}>
                <iframe
                  src={url}
                  title={`Vídeo ${index + 1} — ${w.title}`}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <a
                  className="text-link"
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
        <h2>O que vamos criar</h2>
        <ul className="simple-list">
          {w.program.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h2>O que está incluído</h2>
        <ul className="simple-list">
          {w.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
