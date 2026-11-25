"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductImageGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const rail = track.current;
    const slide = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !slide) return;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({
      left: direction * (slide.offsetWidth + gap),
      behavior: "smooth",
    });
  }

  if (!images.length) return null;

  return (
    <section
      className="mt-5 border-t border-[#e8e5df] pt-5 md:mt-6 md:pt-6"
      aria-labelledby="product-gallery-title"
    >
      <div className="mb-5">
        <span className="block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">Cada detalhe importa</span>
        <h2 id="product-gallery-title" className="mb-0 mt-1 text-[clamp(1.7rem,6vw,2.25rem)]">Veja de perto</h2>
      </div>
      <div className="relative">
        {images.length > 1 && (
          <>
            <button
              className="absolute left-[8%] top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-[#302c26] shadow-lg md:left-[4%]"
              type="button"
              aria-label="Ver imagem anterior"
              onClick={() => move(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              className="absolute right-[8%] top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-[#302c26] shadow-lg md:right-[4%]"
              type="button"
              aria-label="Ver próxima imagem"
              onClick={() => move(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </>
        )}
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[8%] py-1 pb-3 [scrollbar-width:thin] [scrollbar-color:#999_transparent] md:gap-5 md:px-[5%]"
          ref={track}
          tabIndex={0}
          aria-label={`Galeria de imagens de ${name}`}
        >
          {images.map((image, index) => (
            <figure className="relative m-0 aspect-[4/3] w-[84%] shrink-0 snap-center overflow-hidden rounded-lg bg-[#f2f1ee] md:aspect-[16/10] md:w-[44%]" key={`${image}-${index}`}>
              <img
                className="size-full object-cover"
                src={image}
                alt={`${name} — imagem ${index + 1}`}
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
