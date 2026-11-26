"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Ticket,
  Trash2,
} from "lucide-react";
import { money } from "../site";
import {
  cartLineKey,
  readCart,
  type CartLine,
  writeCart,
} from "./add-to-cart-button";

export function CustomerCart() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [openingCheckout, setOpeningCheckout] = useState(false);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const refresh = () => setItems(readCart());
    refresh();
    void fetch("/api/cart", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        if (Array.isArray(result.items) && result.items.length) {
          writeCart(result.items);
          setItems(result.items);
        } else {
          for (const item of readCart()) {
            await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ item }),
            });
          }
        }
      })
      .catch(() => undefined);
    window.addEventListener("storage", refresh);
    window.addEventListener("ofir-cart-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("ofir-cart-updated", refresh);
    };
  }, []);

  const total = items.reduce(
    (sum, item) => sum + item.unit_cents * item.quantity,
    0,
  );
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  async function updateQuantity(item: CartLine, quantity: number) {
    const key = cartLineKey(item);
    const previous = items;
    const next = items.map((line) =>
      cartLineKey(line) === key ? { ...line, quantity } : line,
    );
    setMessage("");
    setUpdatingKey(key);
    writeCart(next);
    setItems(next);
    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: item.kind,
          catalog_id: item.catalog_id,
          ticket_name: item.ticket_name,
          quantity,
        }),
      });
      const result = await response.json();
      if (response.status === 401) return;
      if (!response.ok) throw new Error(result.error ?? "Não foi possível atualizar a quantidade.");
    } catch (error) {
      writeCart(previous);
      setItems(previous);
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a quantidade.",
      );
    } finally {
      setUpdatingKey(null);
    }
  }

  async function removeItem(item: CartLine) {
    const key = cartLineKey(item);
    const previous = items;
    const next = items.filter((line) => cartLineKey(line) !== key);
    setMessage("");
    setUpdatingKey(key);
    writeCart(next);
    setItems(next);
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: item.kind,
          catalog_id: item.catalog_id,
          ticket_name: item.ticket_name,
        }),
      });
      const result = await response.json();
      if (response.status === 401) return;
      if (!response.ok) throw new Error(result.error ?? "Não foi possível remover o item.");
    } catch (error) {
      writeCart(previous);
      setItems(previous);
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o item.",
      );
    } finally {
      setUpdatingKey(null);
    }
  }

  async function checkout() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/mercado-pago", {
        method: "POST",
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = "/conta/acessar?retorno=carrinho";
        return;
      }
      if (!response.ok)
        throw Error(result.error ?? "Não foi possível iniciar o checkout.");
      setOpeningCheckout(true);
      window.location.assign(result.checkoutUrl);
      window.setTimeout(() => setOpeningCheckout(false), 10000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o checkout.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!items.length)
    return (
      <section className="mx-auto my-[8vh] grid min-h-[45vh] w-full max-w-[48rem] place-content-center justify-items-center rounded-[1.5rem] border border-[#e8e6e1] bg-white px-[7%] py-[8vh] text-center shadow-[0_0.75rem_2.5rem_rgba(0,0,0,0.05)]">
        <span className="mb-5 grid size-[4.5rem] place-items-center rounded-full bg-[#f3f1ec] text-[#625642]"><ShoppingBag aria-hidden="true" /></span>
        <h1 className="text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.04em]">Seu carrinho está vazia</h1>
        <p className="mt-3 max-w-[28rem] text-[0.95rem] leading-7 text-[#696969]">Escolha uma vela ou um ingresso para continuar sua experiência com a Ofir.</p>
        <Link className="button mt-7" href="/loja">Explorar a loja <ArrowRight size={16} /></Link>
      </section>
    );

  return (
    <section className="mx-auto w-full max-w-[90rem] py-[4vh] md:py-[7vh]">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#e8e6e1] pb-5 md:mb-9 md:pb-7">
        <div>
          <span className="eyebrow">SEU PEDIDO OFIR</span>
          <h1 className="mt-2 text-[clamp(2rem,5vw,3.4rem)] leading-tight tracking-[-0.05em]">Seu carrinho</h1>
          <p className="mt-2 text-[0.9rem] text-[#696969]">Revise seus itens antes de finalizar.</p>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-[0.8rem] text-[#555] shadow-sm">{count} {count === 1 ? "item" : "itens"}</span>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.8fr)] md:gap-7 lg:gap-9">
        <div className="grid gap-3 md:gap-4">
          {items.map((item) => {
            const key = cartLineKey(item);
            const LineIcon = item.kind === "workshop" ? Ticket : Package;
            return (
              <article key={key} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-[1rem] border border-[#e8e6e1] bg-white p-3 shadow-[0_0.35rem_1.4rem_rgba(0,0,0,0.035)] sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-5 sm:p-4">
                <div className="grid aspect-square place-items-center overflow-hidden rounded-[0.75rem] bg-[#f3f1ec] text-[#82775f]">
                  {item.image ? <img className="size-full object-cover" src={item.image} alt="" loading="lazy" /> : <LineIcon size={25} aria-hidden="true" />}
                </div>
                <div className="flex min-w-0 flex-col justify-between gap-3 py-0.5 sm:flex-row sm:items-center sm:gap-5">
                  <div className="min-w-0">
                    <span className="text-[0.62rem] uppercase tracking-[0.13em] text-[#89857d]">{item.kind === "workshop" ? "Experiência presencial" : "Feito à mão pela Ofir"}</span>
                    <h2 className="mt-1 line-clamp-2 text-[1rem] font-medium leading-snug tracking-[-0.02em] sm:text-[1.125rem]">{item.name}</h2>
                    {item.ticket_name && <p className="mt-1 text-[0.82rem] text-[#696969]">{item.ticket_name}</p>}
                    <p className="mt-2 text-[0.85rem] text-[#555]">{money(item.unit_cents / 100)} <span className="text-[#999]">/ unidade</span></p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                    <div className="inline-flex h-9 items-center rounded-full border border-[#dedbd4] bg-[#faf9f6]" role="group" aria-label={`Quantidade de ${item.name}`}>
                      <button className="grid size-9 place-items-center rounded-full text-[#555] transition hover:bg-[#efede8] disabled:opacity-40" type="button" aria-label={`Diminuir quantidade de ${item.name}`} disabled={item.quantity <= 1 || updatingKey !== null} onClick={() => void updateQuantity(item, item.quantity - 1)}><Minus size={14} /></button>
                      <span className="min-w-[1.75rem] text-center text-[0.85rem] tabular-nums" aria-live="polite">{item.quantity}</span>
                      <button className="grid size-9 place-items-center rounded-full text-[#555] transition hover:bg-[#efede8] disabled:opacity-40" type="button" aria-label={`Aumentar quantidade de ${item.name}`} disabled={item.quantity >= 20 || updatingKey !== null} onClick={() => void updateQuantity(item, item.quantity + 1)}><Plus size={14} /></button>
                    </div>
                    <strong className="text-[1rem] font-medium tabular-nums">{money((item.unit_cents * item.quantity) / 100)}</strong>
                    <button className="inline-flex items-center gap-1 text-[0.75rem] text-[#777] underline-offset-4 hover:text-[#222] hover:underline disabled:opacity-40" type="button" disabled={updatingKey !== null} onClick={() => void removeItem(item)}><Trash2 size={13} /> Remover</button>
                  </div>
                </div>
              </article>
            );
          })}
          <Link href="/loja" className="mt-1 inline-flex w-fit items-center gap-2 px-1 py-2 text-[0.82rem] text-[#5e5648] hover:underline"><ArrowRight className="rotate-180" size={15} /> Continuar comprando</Link>
        </div>

        <aside className="rounded-[1rem] border border-[#e8e6e1] bg-white p-5 shadow-[0_0.35rem_1.4rem_rgba(0,0,0,0.035)] sm:p-6 md:sticky md:top-[6vh]">
          <h2 className="text-[1.15rem] font-medium tracking-[-0.025em]">Resumo do pedido</h2>
          <div className="mt-5 grid gap-3 border-b border-[#e8e6e1] pb-5 text-[0.85rem]">
            <div className="flex justify-between gap-3 text-[#666]"><span>Itens ({count})</span><span className="tabular-nums">{money(total / 100)}</span></div>
            <div className="flex justify-between gap-3 text-[#666]"><span>Entrega</span><span className="text-right">Combinada após a compra</span></div>
          </div>
          <div className="flex items-baseline justify-between gap-3 py-5"><span className="text-[0.95rem] font-medium">Total parcial</span><strong className="text-[1.5rem] font-medium tracking-[-0.04em] tabular-nums">{money(total / 100)}</strong></div>
          {message && <p role="alert" className="mb-4 rounded-[0.625rem] border border-[#e4c7c2] bg-[#fff6f4] px-3 py-2.5 text-[0.8rem] leading-5 text-[#922f27]">{message}</p>}
          {(busy || openingCheckout) && <p className="mb-3 text-center text-[0.78rem] leading-5 text-[#555]" role="status">{openingCheckout ? "Abrindo o checkout seguro do Mercado Pago…" : "Preparando seu pedido…"}</p>}
          <button className="button flex w-full items-center justify-center" disabled={busy || openingCheckout || updatingKey !== null} onClick={checkout}>{openingCheckout ? "Abrindo checkout seguro…" : busy ? "Preparando checkout…" : <>Finalizar compra <ArrowRight size={16} /></>}</button>
          <p className="mt-4 flex items-start gap-2 text-[0.72rem] leading-5 text-[#777]"><Check className="mt-0.5 shrink-0 text-[#6c765b]" size={14} /> Pagamento seguro processado pelo Mercado Pago.</p>
          <p className="mt-2 flex items-start gap-2 text-[0.72rem] leading-5 text-[#777]"><LockKeyhole className="mt-0.5 shrink-0" size={13} /> Seus itens ficam associados à sua conta.</p>
        </aside>
      </div>
    </section>
  );
}
