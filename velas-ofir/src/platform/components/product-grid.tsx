"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "../server/catalog";
import { money } from "../site";

export const labels = {
  ready: "Pronta entrega",
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
};

export function ProductGrid({ items }: { items: Product[] }) {
  const [filter, setFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const collections = Array.from(
    new Set(items.map((product) => product.collection.trim()).filter(Boolean)),
  );
  const shown = items.filter(
    (product) =>
      (filter === "all" || product.availability === filter) &&
      (collectionFilter === "all" ||
        product.collection.trim() === collectionFilter),
  );

  return (
    <>
      {collections.length > 0 && (
        <div
          className="mb-5 flex gap-3 overflow-x-auto overscroll-x-contain px-0.5 pb-3 [scrollbar-width:none]"
          aria-label="Coleções de produtos"
        >
          <button
            className={`flex min-w-[4.5rem] shrink-0 flex-col items-center gap-2 border-0 border-b pb-2 text-[0.7rem] transition ${collectionFilter === "all" ? "border-[#222] text-[#171717]" : "border-transparent bg-transparent text-[#777]"}`}
            aria-pressed={collectionFilter === "all"}
            onClick={() => setCollectionFilter("all")}
          >
            <span
              className="grid size-12 place-items-center rounded-full bg-[#f2f1ee] text-xl"
              aria-hidden="true"
            >
              ○
            </span>
            <span>Todas</span>
          </button>

          {collections.map((collection) => {
            const representative = items.find(
              (product) => product.collection.trim() === collection,
            );
            const active = collectionFilter === collection;
            return (
              <button
                className={`flex min-w-[4.5rem] shrink-0 flex-col items-center gap-2 border-0 border-b pb-2 text-[0.7rem] transition ${active ? "border-[#222] text-[#171717]" : "border-transparent bg-transparent text-[#777]"}`}
                aria-pressed={active}
                key={collection}
                onClick={() => setCollectionFilter(collection)}
              >
                {representative?.image ? (
                  <img
                    className="size-12 rounded-full bg-[#f2f1ee] object-cover"
                    src={representative.image}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="grid size-12 place-items-center rounded-full bg-[#f2f1ee] text-xl"
                    aria-hidden="true"
                  >
                    ✳
                  </span>
                )}
                <span>{collection}</span>
              </button>
            );
          })}
        </div>
      )}

      <div
        className="mb-6 flex flex-wrap items-center gap-2.5"
        role="group"
        aria-label="Filtrar produtos por disponibilidade"
      >
        {[
          ["all", "Todos os produtos"],
          ["ready", "Pronta entrega"],
          ["made_to_order", "Sob encomenda"],
        ].map(([value, label]) => {
          const active = filter === value;
          return (
            <button
              className={`rounded-full border px-4 py-2 text-[0.75rem] transition ${active ? "border-[#171717] bg-[#171717] text-white" : "border-[#dedbd4] bg-white text-[#454545] hover:border-[#171717]"}`}
              aria-pressed={active}
              key={value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          );
        })}
        <span
          className="w-full text-[0.75rem] text-[#777] sm:ml-auto sm:w-auto"
          aria-live="polite"
        >
          {shown.length} {shown.length === 1 ? "produto" : "produtos"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-3 gap-y-6 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-9 xl:grid-cols-4">
        {shown.map((product) => (
          <Link
            className="group relative isolate block min-w-0 overflow-hidden rounded-[0.75rem] bg-[#e8e6e0] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            key={product.id}
            href={`/velas/${product.slug}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {product.image ? (
                <img
                  className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#d8d4c9] to-[#8b806e] px-4 text-center text-sm text-white">
                  Fotografia em breve
                </span>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.62rem] text-[#242420] shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
                {product.collection || "Feito à mão"}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#171613]/95 via-[#171613]/65 to-transparent px-3 pb-3 text-white sm:px-4 sm:pb-4 sm:pt-20">
                <p className="mb-2 line-clamp-2 text-[clamp(0.9rem,2.5vw,1rem)] font-medium leading-tight tracking-[-0.02em] text-gray-50">
                  {product.name}
                </p>
                {(product.size || product.burnTime || product.material) && (
                  <ul
                    className="ml-0 pl-0 mb-3 flex flex-row h-full gap-1.5"
                    aria-label="Detalhes do produto"
                  >
                    {[product.size, product.burnTime, product.material]
                      .filter(Boolean)
                      .map((detail) => (
                        <li
                          key={detail}
                          className="rounded-full bg-white/15 px-2 py-1 text-[0.58rem] text-white/90 list-none"
                        >
                          {detail}
                        </li>
                      ))}
                  </ul>
                )}
                <div className="flex items-center justify-between gap-2 text-[0.7rem] font-semibold sm:text-sm">
                  <span>{money(product.price)}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="rounded-xl bg-[#f3f3f3] p-6 text-center text-[#555]">
          Nenhum produto nesta seleção. Experimente outro filtro.
        </p>
      )}
    </>
  );
}
