import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { workshops, type Workshop } from "@/platform/server/catalog";
import { Breadcrumb } from "@/platform/components/shell";
import { WorkshopShowcaseScroller } from "@/platform/components/workshop-showcase-scroller";
import { site } from "@/platform/site";

export const metadata = {
  title: "Workshops presenciais",
  description:
    "Conheça os workshops presenciais da Ofir. Uma experiência para desacelerar, explorar o processo artesanal e criar com as próprias mãos.",
  alternates: { canonical: "/workshops" },
};
export const dynamic = "force-dynamic";

function eventDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function monthGroupsFor(items: Workshop[]) {
  const groups = new Map<string, { title: string; items: Workshop[] }>();
  const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    month: "long",
    year: "numeric",
  });
  for (const event of items) {
    const date = new Date(event.starts_at);
    const monthParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(date);
    const key = `${monthParts.find((part) => part.type === "year")?.value}-${monthParts.find((part) => part.type === "month")?.value}`;
    const title = monthFormatter
      .format(date)
      .replace(/^./, (letter) => letter.toLocaleUpperCase("pt-BR"));
    const group = groups.get(key) ?? { title, items: [] };
    group.items.push(event);
    groups.set(key, group);
  }
  return [...groups.entries()];
}

function EventCard({ event }: { event: Workshop }) {
  return (
    <Link
      className="group relative block aspect-[16/10] w-[clamp(21rem,82vw,34rem)] shrink-0 snap-start overflow-hidden rounded-xl bg-[#171717] text-white shadow-[0_0.3rem_1rem_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:z-10"
      href={`/workshops/${event.slug}`}
    >
      {event.image ? (
        <img
          className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.025]"
          src={event.image}
          alt={event.title}
          loading="lazy"
        />
      ) : (
        <span
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#292929] to-[#111] text-3xl italic text-white"
          aria-hidden="true"
        >
          Ofir
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-[6%] pb-[6%] pt-[18%] text-white">
        <h3 className="mb-2 line-clamp-2 text-[clamp(1.05rem,3vw,1.5rem)] leading-tight text-white">
          {event.title}
        </h3>
        <time className="text-xs text-white/85" dateTime={event.starts_at}>
          {eventDate(event.starts_at)}
        </time>
      </div>
    </Link>
  );
}

export default async function Workshops() {
  const events = await workshops();
  const now = Date.now();
  const upcoming = events.items.filter(
    (event) => new Date(event.starts_at).getTime() > now,
  );
  const past = events.items.filter(
    (event) => new Date(event.starts_at).getTime() <= now,
  );
  const upcomingGroups = monthGroupsFor(upcoming);
  const pastGroups = monthGroupsFor(past);

  return (
    <main className="mx-auto min-h-[60vh] w-[80%] max-w-[90rem] pb-[8vh] pt-[3vh] font-[family-name:var(--body-sans)] md:pt-[5vh]">
      <Breadcrumb items={[{ title: "Workshops" }]} />

      <header
        className="max-w-80vw flex flex-col align-center justify-center py-2 text-center md:py-3"
        aria-labelledby="workshop-page-title"
      >
        <h1 className="text-[clamp(1.5rem,8vw,3rem)] leading-[1.05] tracking-[-0.055em]">
          Um tempo para criar.
        </h1>
        <p className="text-sm leading-[1.85] text-[#666]">
          Encontros para explorar o processo artesanal, fazer algo com as
          próprias mãos e aproveitar o caminho.
        </p>
      </header>

      {events.items.length > 0 ? (
        <>
          <WorkshopShowcaseScroller items={events.items} />
          {upcoming.length > 0 && (
            <section
              className="grid gap-7 pt-2 md:gap-8"
              aria-labelledby="workshop-listing-title"
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">
                    Encontre seu próximo encontro
                  </span>
                  <h2
                    className="mb-0 text-[clamp(1.85rem,7vw,2.5rem)]"
                    id="workshop-listing-title"
                  >
                    Próximas experiências
                  </h2>
                </div>
                <span className="text-xs text-[#777]">
                  {upcoming.length}{" "}
                  {upcoming.length === 1 ? "workshop" : "workshops"}
                </span>
              </div>
              <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:thin] [scrollbar-color:#c9bca8_transparent]">
                {upcomingGroups.map(([key, group]) => (
                  <section
                    className="min-w-0 shrink-0 snap-start"
                    key={key}
                    aria-labelledby={`workshop-month-${key}`}
                  >
                    <h2
                      className="mb-3 text-xl md:text-2xl"
                      id={`workshop-month-${key}`}
                    >
                      {group.title}
                    </h2>
                    <div
                      className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 py-2 pb-5 [scrollbar-width:thin] [scrollbar-color:#c9bca8_transparent] sm:gap-5"
                      tabIndex={0}
                      aria-label={`Próximos workshops de ${group.title}`}
                    >
                      {group.items.map((event) => (
                        <EventCard event={event} key={event.id} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section
              className="grid gap-7 pt-2 md:gap-8"
              aria-labelledby="workshop-history-title"
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">
                    Memórias feitas à mão
                  </span>
                  <h2
                    className="mb-0 text-[clamp(1.85rem,7vw,2.5rem)]"
                    id="workshop-history-title"
                  >
                    Encontros que já vivemos
                  </h2>
                </div>
                <span className="text-xs text-[#777]">
                  {past.length} {past.length === 1 ? "workshop" : "workshops"}
                </span>
              </div>
              <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:thin] [scrollbar-color:#c9bca8_transparent]">
                {pastGroups.map(([key, group]) => (
                  <section
                    className="min-w-0 shrink-0 snap-start"
                    key={`history-${key}`}
                    aria-labelledby={`workshop-history-month-${key}`}
                  >
                    <h2
                      className="mb-3 text-xl md:text-2xl"
                      id={`workshop-history-month-${key}`}
                    >
                      {group.title}
                    </h2>
                    <div
                      className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 py-2 pb-5 [scrollbar-width:thin] [scrollbar-color:#c9bca8_transparent] sm:gap-5"
                      tabIndex={0}
                      aria-label={`Workshops realizados em ${group.title}`}
                    >
                      {group.items.map((event) => (
                        <EventCard event={event} key={event.id} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section
          className="max-w-[44rem] rounded-2xl bg-[#f4f4f2] px-[7%] py-[6vh]"
          aria-labelledby="workshop-listing-title"
        >
          <span className="block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">
            Próximos encontros
          </span>
          <h2 className="my-3 text-3xl" id="workshop-listing-title">
            Novas experiências estão a caminho.
          </h2>
          <p className="text-sm leading-7">
            {events.state === "unavailable"
              ? "Não conseguimos consultar a agenda agora. Fale com a equipe para conhecer as próximas turmas."
              : "As novas datas serão anunciadas por aqui. Fale com a equipe para saber mais."}
          </p>
          <a
            className="mt-2 inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#171717] px-5 py-3 text-sm text-white"
            target="_blank"
            rel="noopener noreferrer"
            href={`${site.whatsapp}?text=${encodeURIComponent("Olá! Quero saber sobre os próximos workshops da Ofir.")}`}
          >
            Quero saber das próximas datas <ArrowUpRight size={17} />
          </a>
        </section>
      )}
    </main>
  );
}
