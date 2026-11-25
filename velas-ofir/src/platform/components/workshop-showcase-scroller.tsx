"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Workshop } from "@/platform/server/catalog";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function WorkshopShowcaseScroller({ items }: { items: Workshop[] }) {
  const initialIndex = Math.floor(items.length / 2);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  function move(direction: -1 | 1) {
    const nextIndex = (activeIndex + direction + items.length) % items.length;
    setActiveIndex(nextIndex);
  }

  return (
    <section
      className="relative mb-12 -mx-[3vw] overflow-x-clip md:-mx-[5vw]"
      aria-label="Workshops em destaque"
    >
      <div className="relative mx-auto my-2 aspect-[2/1] w-full md:my-3 md:aspect-[2.1/1]" aria-label="Workshops em destaque">
        {items.length > 1 && (
          <button
            className="absolute left-[10%] top-1/2 z-30 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/95 text-[#171717] shadow-lg focus-visible:outline-black md:left-[17%] md:size-11"
            type="button"
            aria-label="Ver workshop anterior"
            onClick={() => move(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
        )}
        {items.map((event, index) => {
            const relativeIndex = (index - activeIndex + items.length) % items.length;
            const position = relativeIndex === 0
              ? "center"
              : relativeIndex === 1
                ? "right"
                : relativeIndex === items.length - 1
                  ? "left"
                  : "hidden";
            const positionClass = {
              center: "left-[12%] z-20 w-[76%] scale-100 opacity-100 shadow-[0_1rem_2.5rem_rgba(36,36,32,0.2)]",
              left: "left-[-12%] z-10 w-[56%] scale-[0.84] opacity-70",
              right: "left-[56%] z-10 w-[56%] scale-[0.84] opacity-70",
              hidden: "left-1/2 z-0 w-[56%] scale-[0.7] opacity-0 pointer-events-none",
            }[position];
            return (
              <Link
                className={`absolute top-1/2 block aspect-[16/10] -translate-y-1/2 overflow-hidden rounded-xl bg-[#eeeae2] shadow-[0_0.5rem_1.5rem_rgba(36,36,32,0.2)] transition-all duration-500 ease-in-out md:aspect-[16/9] md:rounded-2xl ${positionClass}`}
                href={`/workshops/${event.slug}`}
                key={event.id}
                aria-current={position === "center" ? "true" : undefined}
                aria-hidden={position === "hidden"}
                tabIndex={position === "hidden" ? -1 : undefined}
              >
                {event.image ? (
                  <img
                    className="absolute inset-0 size-full object-cover"
                    src={event.image}
                    alt={event.title}
                    loading={Math.abs(index - activeIndex) <= 1 ? "eager" : "lazy"}
                  />
                ) : (
                  <span
                    className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#f0f0f0] to-[#fafafa] text-3xl italic text-[#555]"
                    aria-hidden="true"
                  >
                    Ofir
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 z-10 grid gap-1.5 bg-gradient-to-t from-[#161512]/95 to-transparent px-4 pb-4 pt-12 text-white sm:px-7 sm:pb-6 sm:pt-20">
                  <span className="text-[0.7rem] tracking-[0.1em] text-gray-50">
                    {new Date(event.starts_at).getTime() <= Date.now()
                      ? "Experiência realizada"
                      : "Data"}{" "}
                    · {formatDate(event.starts_at)}
                  </span>
                  <p className="text-[clamp(1rem,2.6vw,2rem)] font-normal leading-tight tracking-[-0.025em] text-gray-100">
                    {event.title}
                  </p>
                </span>
              </Link>
            );
        })}
        {items.length > 1 && (
          <button
            className="absolute right-[10%] top-1/2 z-30 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/95 text-[#171717] shadow-lg focus-visible:outline-black md:right-[17%] md:size-11"
            type="button"
            aria-label="Ver próximo workshop"
            onClick={() => move(1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </div>
      <div
        className="text-center text-[0.6rem] tracking-[0.13em] text-[#777]"
        aria-live="polite"
      >
        {String(activeIndex + 1).padStart(2, "0")} /{" "}
        {String(items.length).padStart(2, "0")}
      </div>
    </section>
  );
}
