import Link from "next/link";
import { ArrowUpRight, MapPin, CalendarDays } from "lucide-react";
import { workshops } from "@/platform/server/catalog";
import { Breadcrumb } from "@/platform/components/shell";
import { money, site } from "@/platform/site";
export const metadata = {
  title: "Workshops presenciais",
  description:
    "Conheça os workshops presenciais da Ofir. Uma experiência para desacelerar, explorar o processo artesanal e criar com as próprias mãos.",
  alternates: { canonical: "/workshops" },
};
export const dynamic = "force-dynamic";
export default async function Workshops() {
  const events = await workshops();
  return (
    <>
      <section className="container page-content">
        <Breadcrumb items={[{ title: "Workshops" }]} />
        <div className="page-heading">
          <span className="eyebrow">Um encontro com a sua criatividade</span>
          <h1>
            Reserve um tempo.
            <br />
            <em>Ele é seu.</em>
          </h1>
          <p>
            Saia do automático. Conheça as experiências presenciais da Ofir e
            descubra um novo jeito de criar.
          </p>
          <a className="button" href="#agenda">
            Encontre sua experiência <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="experience-grid">
          <div>
            <span className="eyebrow">01 / PRESENÇA</span>
            <h2>
              Menos pressa.
              <br />
              Mais descoberta.
            </h2>
            <p>
              Um convite para colocar a atenção no que está diante de você e
              conhecer o processo artesanal.
            </p>
          </div>
          <div>
            <span className="eyebrow">02 / CRIAÇÃO</span>
            <h2>
              Suas mãos.
              <br />
              Novas possibilidades.
            </h2>
            <p>
              Explore materiais, aromas e escolhas que dão forma a uma criação
              com a sua personalidade.
            </p>
          </div>
          <div>
            <span className="eyebrow">03 / ENCONTRO</span>
            <h2>
              Uma experiência
              <br />
              para compartilhar.
            </h2>
            <p>
              Venha conhecer a Ofir de perto. Convide alguém especial ou viva um
              momento só seu.
            </p>
          </div>
        </div>
      </section>
      <section className="agenda-section" id="agenda">
        <div className="container">
          <span className="eyebrow">Próximas experiências</span>
          <h2>Escolha seu encontro.</h2>
          {events.items.length ? (
            <div className="event-grid">
              {events.items.map((event) => (
                <Link
                  className="event-card"
                  href={`/workshops/${event.slug}`}
                  key={event.id}
                >
                  {event.image && (
                    <img
                      className="event-card-photo"
                      src={event.image}
                      alt={event.title}
                      loading="lazy"
                    />
                  )}
                  <span className="eyebrow">Presencial</span>
                  <h3>{event.title}</h3>
                  <p>
                    <CalendarDays size={16} />
                    {new Date(event.starts_at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                  <p>
                    <MapPin size={16} />
                    {event.location}
                  </p>
                  <strong>{money(event.price_cents / 100)}</strong>
                  <span className="text-link">
                    Conheça a turma <ArrowUpRight size={17} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="agenda-empty">
              <p>
                {events.state === "unavailable"
                  ? "Não conseguimos consultar a agenda agora. Fale com a equipe para conhecer as próximas turmas."
                  : "Novas datas serão anunciadas aqui. Quer saber sobre a próxima turma?"}
              </p>
              <a
                className="button"
                target="_blank"
                rel="noopener noreferrer"
                href={`${site.whatsapp}?text=${encodeURIComponent("Olá! Quero saber sobre os próximos workshops da Ofir.")}`}
              >
                Quero saber das próximas datas <ArrowUpRight size={17} />
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
