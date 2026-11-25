"use client";
import { useState } from "react";
export function RandomPicker() {
  const [number, setNumber] = useState<number | null>(null);
  const range = 22

  function draw(range: number) {
    const cutoff = Math.floor(2 ** 32 / range) * range;
    const value = new Uint32Array(1);
    do {
      crypto.getRandomValues(value);
    } while (value[0] >= cutoff);
    setNumber((value[0] % range) + 1);
  }
  return (
    <div className="relative isolate overflow-hidden border border-[#e5e3dc] bg-[#f5f1e9] bg-[image:linear-gradient(90deg,_rgb(248_246_241_/_94%),_rgb(248_246_241_/_80%)_55%,_rgb(248_246_241_/_72%)),url('/media/images/sorteador-fundo.svg')] bg-cover bg-center px-5 py-[3.75rem] text-center sm:px-[1.875rem]">
      <span className="eyebrow">Sorteador Ofir</span>
      <h1>
        Um número.
        <br />
        <em>Uma surpresa.</em>
      </h1>
      <p>Sorteio de um número entre 1 e {range}.</p>
      <output
        aria-live="polite"
        className="mb-5 block [font-family:var(--serif)] text-[6.25rem] leading-[1.4]"
      >
        {number ?? "—"}
      </output>
      <button className="button" onClick={() => draw(22)}>
        Sortear número
      </button>
    </div>
  );
}
