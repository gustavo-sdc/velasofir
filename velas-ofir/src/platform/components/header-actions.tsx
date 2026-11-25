"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShoppingBag, UserRound, X } from "lucide-react";
import { money } from "@/platform/site";
import {
  cartLineKey,
  readCart,
  type CartLine,
  writeCart,
} from "./add-to-cart-button";

type HeaderMenu = "cart" | "account" | null;

export function HeaderActions() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [openMenu, setOpenMenu] = useState<HeaderMenu>(null);
  const [animatedKey, setAnimatedKey] = useState("");
  const [bagIsAnimating, setBagIsAnimating] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const animationTimer = useRef<number | null>(null);

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
        }
      })
      .catch(() => undefined);

    const handleAdded = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key ?? "";
      setAnimatedKey(key);
      setBagIsAnimating(true);
      if (animationTimer.current !== null)
        window.clearTimeout(animationTimer.current);
      animationTimer.current = window.setTimeout(() => {
        setBagIsAnimating(false);
        setAnimatedKey("");
      }, 900);
    };
    const handlePointer = (event: PointerEvent) => {
      if (!actionsRef.current?.contains(event.target as Node))
        setOpenMenu(null);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    window.addEventListener("ofir-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("ofir-cart-item-added", handleAdded);
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("ofir-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("ofir-cart-item-added", handleAdded);
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      if (animationTimer.current !== null)
        window.clearTimeout(animationTimer.current);
    };
  }, []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.unit_cents * item.quantity,
    0,
  );

  async function removeItem(item: CartLine) {
    const next = items.filter(
      (line) => cartLineKey(line) !== cartLineKey(item),
    );
    writeCart(next);
    setItems(next);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: item.kind,
        catalog_id: item.catalog_id,
        ticket_name: item.ticket_name,
      }),
    }).catch(() => undefined);
  }

  return (
    <div className="header-actions" ref={actionsRef}>
      <div className="header-action-wrap">
        <button
          className={`bag-link header-action-button${bagIsAnimating ? " is-adding" : ""}`}
          type="button"
          aria-expanded={openMenu === "cart"}
          aria-haspopup="dialog"
          aria-controls="header-cart-menu"
          onClick={() =>
            setOpenMenu((current) => (current === "cart" ? null : "cart"))
          }
        >
          <span className="header-action-icon-wrap">
            <ShoppingBag size={18} aria-hidden="true" />
            {count > 0 && (
              <span className="header-cart-count" key={count}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          <span>Carrinho</span>
          <ChevronDown size={13} aria-hidden="true" />
        </button>
        {openMenu === "cart" && (
          <section
            className="header-popover header-cart-popover"
            id="header-cart-menu"
            role="dialog"
            aria-label="carrinho de compras"
          >
            <div className="header-popover-heading">
              <div>
                <span className="eyebrow">Sua seleção</span>
                <h2>Carrinho ({count})</h2>
              </div>
              <button
                className="header-popover-close"
                type="button"
                aria-label="Fechar carrinho"
                onClick={() => setOpenMenu(null)}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            {items.length ? (
              <>
                <ul className="header-cart-list">
                  {items.map((item) => {
                    const key = cartLineKey(item);
                    return (
                      <li
                        className={`header-cart-item${animatedKey === key ? " is-added" : ""}`}
                        key={key}
                      >
                        <span className="header-cart-thumb">
                          {item.image ? (
                            <img src={item.image} alt="" />
                          ) : (
                            <ShoppingBag size={17} aria-hidden="true" />
                          )}
                        </span>
                        <span className="header-cart-item-copy">
                          <strong>{item.name}</strong>
                          {item.ticket_name && (
                            <small>{item.ticket_name}</small>
                          )}
                          <small>
                            {item.quantity} × {money(item.unit_cents / 100)}
                          </small>
                        </span>
                        <span className="header-cart-item-end">
                          <strong>
                            {money((item.unit_cents * item.quantity) / 100)}
                          </strong>
                          <button
                            type="button"
                            aria-label={`Retirar ${item.name} da carrinho`}
                            onClick={() => void removeItem(item)}
                          >
                            Retirar
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="header-cart-total">
                  <span>Subtotal</span>
                  <strong>{money(total / 100)}</strong>
                </div>
                <Link
                  className="button header-cart-buy"
                  href="/carrinho"
                  onClick={() => setOpenMenu(null)}
                >
                  Finalizar compra
                </Link>
              </>
            ) : (
              <div className="header-cart-empty">
                <p>Seu carrinho está vazio.</p>
                <Link href="/loja" onClick={() => setOpenMenu(null)}>
                  Explorar a loja
                </Link>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="header-action-wrap">
        <button
          className="bag-link header-action-button"
          type="button"
          aria-expanded={openMenu === "account"}
          aria-haspopup="menu"
          aria-controls="header-account-menu"
          onClick={() =>
            setOpenMenu((current) => (current === "account" ? null : "account"))
          }
        >
          <UserRound size={17} aria-hidden="true" />
          <span>Minha conta</span>
          <ChevronDown size={13} aria-hidden="true" />
        </button>
        {openMenu === "account" && (
          <nav
            className="header-popover header-account-popover"
            id="header-account-menu"
            aria-label="Atalhos da conta"
          >
            <span className="eyebrow">Acesse rapidamente</span>
            <Link href="/conta" onClick={() => setOpenMenu(null)}>
              Minha conta
            </Link>
            <Link
              href="/conta#historico-de-compras"
              onClick={() => setOpenMenu(null)}
            >
              Minhas compras
            </Link>
            <Link href="/carrinho" onClick={() => setOpenMenu(null)}>
              Minha carrinho
            </Link>
            <Link href="/conta/acessar" onClick={() => setOpenMenu(null)}>
              Entrar ou criar conta
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
