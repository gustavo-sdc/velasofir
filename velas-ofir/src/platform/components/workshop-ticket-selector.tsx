"use client";

import { useState } from "react";
import type { TicketType } from "@/platform/domain/validation";
import { money } from "@/platform/site";
import { WorkshopTicketPurchase } from "./workshop-ticket-purchase";

export function WorkshopTicketSelector({
  tickets,
  workshopId,
  workshopTitle,
  image,
}: {
  tickets: TicketType[];
  workshopId: string;
  workshopTitle: string;
  image: string | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ticket = tickets[selectedIndex];
  if (!ticket) return null;

  const now = Date.now();
  const upcoming =
    ticket.sales_start && new Date(ticket.sales_start).getTime() > now;
  const closed = ticket.sales_end && new Date(ticket.sales_end).getTime() < now;
  const soldOut = ticket.quantity <= 0;
  const disabled = Boolean(upcoming || closed || soldOut);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label
          className="text-sm font-medium text-[#333]"
          htmlFor="workshop-ticket-type"
        >
          Tipo de ingresso
        </label>
        <select
          className="min-h-12 w-full rounded-lg border border-[#d4d4d4] bg-white px-3 text-sm text-[#171717] outline-none transition focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/15"
          id="workshop-ticket-type"
          value={selectedIndex}
          onChange={(event) => setSelectedIndex(Number(event.target.value))}
        >
          {tickets.map((option, index) => (
            <option value={index} key={`${option.name}-${index}`}>
              {option.name} · {option.price_cents === 0 ? "Gratuito" : money(option.price_cents / 100)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="mb-0 text-sm font-semibold text-[#222]">{ticket.name}</h3>
            {ticket.description && (
              <p className="mb-0 mt-1 text-xs leading-5 text-[#666]">
                {ticket.description}
              </p>
            )}
          </div>
          <span className="whitespace-nowrap text-lg font-semibold text-[#171717]">
            {ticket.price_cents === 0
              ? "Gratuito"
              : money(ticket.price_cents / 100)}
          </span>
        </div>

        {(upcoming || closed || soldOut) && (
          <small className="border-t border-[#e5e5e5] pt-2 text-xs leading-relaxed text-[#555]">
            {soldOut
              ? "Ingressos esgotados"
              : upcoming
                ? `Vendas a partir de ${new Date(ticket.sales_start!).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
                : "Período de vendas encerrado"}
          </small>
        )}

        <WorkshopTicketPurchase
          disabled={disabled}
          minQuantity={ticket.min_per_order}
          maxQuantity={Math.min(ticket.max_per_order, ticket.quantity)}
          line={{
            kind: "workshop",
            catalog_id: workshopId,
            name: workshopTitle,
            ticket_name: ticket.name,
            quantity: 1,
            unit_cents: ticket.price_cents,
            ...(image ? { image } : {}),
          }}
        />
      </div>
    </div>
  );
}
