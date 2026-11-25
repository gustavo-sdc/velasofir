"use client";
import { useState } from "react";

export type CartLine = {
  kind: "product" | "workshop";
  catalog_id: string;
  name: string;
  ticket_name: string;
  quantity: number;
  unit_cents: number;
  image?: string;
};
const CART_KEY = "ofir-customer-cart";

export function cartLineKey(line: CartLine) {
  return `${line.kind}:${line.catalog_id}:${line.ticket_name}`;
}

export function notifyCartItemAdded(line: CartLine) {
  window.dispatchEvent(
    new CustomEvent("ofir-cart-item-added", {
      detail: { key: cartLineKey(line) },
    }),
  );
}

export function readCart(): CartLine[] {
  try {
    const value = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items.slice(0, 30)));
  window.dispatchEvent(new Event("ofir-cart-updated"));
}

export function AddToCartButton({
  line,
  disabled = false,
}: {
  line: CartLine;
  disabled?: boolean;
}) {
  const [added, setAdded] = useState(false);
  return (
    <button
      className="button"
      disabled={disabled}
      onClick={async () => {
        const cart = readCart();
        const existing = cart.find(
          (item) =>
            item.kind === line.kind &&
            item.catalog_id === line.catalog_id &&
            item.ticket_name === line.ticket_name,
        );
        if (existing) {
          existing.quantity = Math.min(20, existing.quantity + line.quantity);
          existing.image ??= line.image;
        } else cart.push(line);
        writeCart(cart);
        notifyCartItemAdded(line);
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: line }),
        }).catch(() => undefined);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
    >
      {added ? "Adicionado à carrinho" : "Adicionar à carrinho"}
    </button>
  );
}
