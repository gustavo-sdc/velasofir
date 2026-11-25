"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function WorkshopImageScroller({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const firstSlide = track.current?.firstElementChild as HTMLElement | null;
    if (!firstSlide) return;
    const gap =
      Number.parseFloat(getComputedStyle(track.current!).columnGap) || 0;
    track.current?.scrollBy({
      left: direction * (firstSlide.offsetWidth + gap),
      behavior: "smooth",
    });
  }

  return (
    <section
      className="relative mb-9 -mx-[3vw] md:-mx-[5vw]"
      aria-label={`Fotos do workshop ${title}`}
    >
      {images.length > 1 && (
        <>
          <button
            className="absolute left-[11%] top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/95 text-[#171717] shadow-lg hover:scale-105 focus-visible:outline-black md:left-[19%] md:size-11"
            type="button"
            aria-label="Ver foto anterior"
            onClick={() => move(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            className="absolute right-[11%] top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/95 text-[#171717] shadow-lg hover:scale-105 focus-visible:outline-black md:right-[19%] md:size-11"
            type="button"
            aria-label="Ver próxima foto"
            onClick={() => move(1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </>
      )}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[9%] py-1 pb-3 [scroll-padding-inline:9%] [scrollbar-width:none] md:gap-5 md:px-[15%] md:[scroll-padding-inline:15%] [&::-webkit-scrollbar]:hidden" ref={track} tabIndex={0}>
        {images.map((image, index) => (
          <figure className="m-0 aspect-[4/3] w-[88%] shrink-0 snap-center overflow-hidden bg-[#f2f1ee] md:aspect-[16/8] md:w-[70%]" key={`${image}-${index}`}>
            <img
              className="size-full object-cover"
              src={image}
              alt={`Foto ${index + 1} do workshop ${title}`}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
            />
          </figure>
        ))}
      </div>
      {images.length > 1 && (
        <p className="mt-1 text-center text-[0.65rem] tracking-wide text-[#777]">
          Deslize para conhecer cada detalhe
        </p>
      )}
    </section>
  );
}
