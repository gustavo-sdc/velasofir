"use client";

import { useEffect, useRef, useState } from "react";
import { money } from "@/platform/site";
import {
  notifyCartItemAdded,
  readCart,
  type CartLine,
  writeCart,
} from "./add-to-cart-button";

export function WorkshopTicketPurchase({
  line,
  minQuantity = 1,
  maxQuantity = 20,
  disabled = false,
}: {
  line: CartLine;
  minQuantity?: number;
  maxQuantity?: number;
  disabled?: boolean;
}) {
  const minimum = Math.min(20, Math.max(1, minQuantity));
  const maximum = Math.max(minimum, Math.min(20, maxQuantity));
  const [quantity, setQuantity] = useState(minimum);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const subtotal = line.unit_cents * quantity;

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 4000);
  }

  function addToCart() {
    try {
      const cart = readCart();
      const existing = cart.find(
        (item) =>
          item.kind === line.kind &&
          item.catalog_id === line.catalog_id &&
          item.ticket_name === line.ticket_name,
      );
      const available = Math.max(0, 20 - (existing?.quantity ?? 0));
      const addedQuantity = Math.min(quantity, available);

      if (addedQuantity === 0) {
        showToast(
          "Você já atingiu o limite de 20 ingressos deste tipo no pedido.",
        );
        return;
      }

      const item = { ...line, quantity: addedQuantity };
      if (existing) {
        existing.quantity += addedQuantity;
        existing.image ??= item.image;
      } else cart.push(item);

      writeCart(cart);
      notifyCartItemAdded(item);
      void fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      }).catch(() => undefined);

      const amount = money((addedQuantity * line.unit_cents) / 100);
      const ticketLabel =
        addedQuantity === 1 ? "ingresso adicionado" : "ingressos adicionados";
      const limitMessage =
        addedQuantity < quantity
          ? " Limite de 20 por tipo na sacola atingido."
          : "";
      showToast(
        `${addedQuantity} ${ticketLabel}. Subtotal: ${amount}.${limitMessage}`,
      );
    } catch {
      showToast("Não foi possível adicionar à sacola. Tente novamente.");
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <span
          className="text-sm text-[#555]"
          id={`quantity-${line.ticket_name.replace(/\W+/g, "-")}`}
        >
          Quantidade
        </span>
        <div
          className="inline-flex items-center gap-2 rounded-lg border border-[#d4d4d4] bg-white p-1"
          role="group"
          aria-labelledby={`quantity-${line.ticket_name.replace(/\W+/g, "-")}`}
        >
          <button
            className="grid size-9 place-items-center rounded-md text-[#555] transition hover:bg-[#f5f5f5] focus-visible:outline-black disabled:opacity-40"
            type="button"
            aria-label="Diminuir quantidade"
            onClick={() => setQuantity((value) => Math.max(minimum, value - 1))}
            disabled={disabled || quantity <= minimum}
          >
            −
          </button>
          <output
            className="min-w-6 text-center text-sm font-medium tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </output>
          <button
            className="grid size-9 place-items-center rounded-md text-[#555] transition hover:bg-[#f5f5f5] focus-visible:outline-black disabled:opacity-40"
            type="button"
            aria-label="Aumentar quantidade"
            onClick={() => setQuantity((value) => Math.min(maximum, value + 1))}
            disabled={disabled || quantity >= maximum}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-[#e5e5e5] pt-3" aria-live="polite">
        <span className="text-sm text-[#777]">Subtotal</span>
          <strong className="text-xl font-semibold text-[#171717]">
          {line.unit_cents === 0 ? "Gratuito" : money(subtotal / 100)}
        </strong>
      </div>
      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        onClick={addToCart}
        disabled={disabled}
      >
        Adicionar à sacola
      </button>
      {toast && (
        <div
          className="fixed bottom-4 right-4 z-[60] max-w-[calc(100vw_-_2rem)] rounded-lg border border-[#444] bg-[#171717] px-4 py-3 text-sm leading-relaxed text-white shadow-2xl"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
