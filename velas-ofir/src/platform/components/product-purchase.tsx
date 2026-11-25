"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { money } from "@/platform/site";
import { notifyCartItemAdded, readCart, type CartLine, writeCart } from "./add-to-cart-button";

export function ProductPurchase({ line, maxQuantity, disabled = false }: { line: CartLine; maxQuantity: number; disabled?: boolean }) {
  const maximum = Math.max(1, Math.min(20, maxQuantity));
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => () => { if (toastTimer.current !== null) window.clearTimeout(toastTimer.current); }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 4000);
  }

  function addToCart() {
    try {
      const cart = readCart();
      const existing = cart.find((item) => item.kind === "product" && item.catalog_id === line.catalog_id);
      const available = Math.max(0, Math.min(maximum, 20) - (existing?.quantity ?? 0));
      const addedQuantity = Math.min(quantity, available);
      if (!addedQuantity) { showToast("A quantidade disponível deste produto já está na carrinho."); return; }
      const item = { ...line, quantity: addedQuantity };
      if (existing) { existing.quantity += addedQuantity; existing.image ??= item.image; }
      else cart.push(item);
      writeCart(cart);
      notifyCartItemAdded(item);
      void fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item }) }).catch(() => undefined);
      const subtotal = money((addedQuantity * line.unit_cents) / 100);
      showToast(`${addedQuantity} ${addedQuantity === 1 ? "item adicionado" : "itens adicionados"} à carrinho. Subtotal: ${subtotal}.`);
    } catch { showToast("Não foi possível adicionar à carrinho. Tente novamente."); }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4 border-t border-[#e8e5df] pt-4">
        <span id={`product-quantity-${line.catalog_id}`} className="text-sm text-[#666]">Quantidade</span>
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#dedbd4] bg-white p-1" role="group" aria-labelledby={`product-quantity-${line.catalog_id}`}>
          <button className="grid size-9 place-items-center rounded-md text-[#555] transition hover:bg-[#f3f1ec] disabled:opacity-40" type="button" aria-label="Diminuir quantidade" disabled={disabled || quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))}><Minus size={15} /></button>
          <output className="min-w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">{quantity}</output>
          <button className="grid size-9 place-items-center rounded-md text-[#555] transition hover:bg-[#f3f1ec] disabled:opacity-40" type="button" aria-label="Aumentar quantidade" disabled={disabled || quantity >= maximum} onClick={() => setQuantity((current) => Math.min(maximum, current + 1))}><Plus size={15} /></button>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-[#e8e5df] pt-3" aria-live="polite"><span className="text-sm text-[#777]">Subtotal</span><strong className="text-2xl font-normal text-[#171717]">{money((quantity * line.unit_cents) / 100)}</strong></div>
      <button className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#171717] px-5 py-3 text-sm text-white transition hover:bg-[#333] disabled:opacity-50 sm:w-auto" type="button" disabled={disabled} onClick={addToCart}>Adicionar à carrinho</button>
      {toast && <div className="fixed bottom-4 right-4 z-[60] max-w-[calc(100vw_-_2rem)] rounded-lg border border-[#d9d0c2] bg-[#25251f] px-4 py-3 text-sm leading-relaxed text-white shadow-2xl" role="status" aria-live="polite">{toast}</div>}
    </div>
  );
}
