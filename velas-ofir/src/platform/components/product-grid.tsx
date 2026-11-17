"use client";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "../server/catalog";
import { money } from "../site";
export const labels = {
  ready: "Pronta entrega",
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
};
export function ProductGrid({ items }: { items: Product[] }) {
  const [filter, setFilter] = useState("all");
  const shown = items.filter(
    (p) => filter === "all" || p.availability === filter,
  );
  return (
    <>
      <div
        className="filter-row"
        role="group"
        aria-label="Filtrar produtos por disponibilidade"
      >
        {[
          ["all", "Todos os produtos"],
          ["ready", "Pronta entrega"],
          ["made_to_order", "Sob encomenda"],
        ].map(([value, label]) => (
          <button
            className={`filter ${filter === value ? "active" : ""}`}
            aria-pressed={filter === value}
            key={value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
        <span aria-live="polite">
          {shown.length} {shown.length === 1 ? "produto" : "produtos"}
        </span>
      </div>
      <div className="product-grid">
        {shown.map((product) => (
          <Link
            className="product-card"
            key={product.id}
            href={`/velas/${product.slug}`}
          >
            <div className="product-photo">
              {product.image ? (
                <img src={product.image} alt={product.name} loading="lazy" />
              ) : (
                <span>Fotografia em breve</span>
              )}
              <span className={`status ${product.availability}`}>
                {labels[product.availability]}
              </span>
            </div>
            <div className="product-copy">
              <span className="eyebrow">
                {product.collection || "Feito à mão"}
              </span>
              <h2>{product.name}</h2>
              <p>
                {money(product.price)} <span aria-hidden="true">↗</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="notice">
          Nenhum produto nesta seleção. Experimente outro filtro.
        </p>
      )}
    </>
  );
}
