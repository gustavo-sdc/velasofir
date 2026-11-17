"use client";
import { useState } from "react";
export function RandomPicker() {
  const [number, setNumber] = useState<number | null>(null);
  function draw() {
    const range = 14;
    const cutoff = Math.floor(2 ** 32 / range) * range;
    const value = new Uint32Array(1);
    do {
      crypto.getRandomValues(value);
    } while (value[0] >= cutoff);
    setNumber((value[0] % range) + 1);
  }
  return (
    <div className="empty-state">
      <span className="eyebrow">Sorteador Ofir</span>
      <h1>
        Um número.
        <br />
        <em>Uma surpresa.</em>
      </h1>
      <p>Sorteio de um número entre 1 e 14.</p>
      <output
        aria-live="polite"
        style={{
          display: "block",
          fontFamily: "Georgia,serif",
          fontSize: 100,
          lineHeight: 1.4,
          marginBottom: 20,
        }}
      >
        {number ?? "—"}
      </output>
      <button className="button" onClick={draw}>
        Sortear número
      </button>
    </div>
  );
}
