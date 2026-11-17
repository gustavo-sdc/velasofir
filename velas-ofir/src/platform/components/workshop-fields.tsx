"use client";
import { useState } from "react";
import { ImageUpload } from "./image-upload";
import type { TicketType } from "../domain/validation";
const localDate = (date: string | null) =>
  date
    ? new Date(new Date(date).getTime() - 3 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16)
    : "";
export function WorkshopFields({
  disabled,
  onUploading,
  initialTickets = [],
  initialImages = [],
}: {
  disabled: boolean;
  onUploading: (busy: boolean) => void;
  initialTickets?: TicketType[];
  initialImages?: string[];
}) {
  const [ids, setIds] = useState(
    initialTickets.length ? initialTickets.map((_, i) => i) : [0],
  );
  return (
    <>
      <ImageUpload
        scope="workshop"
        disabled={disabled}
        onUploading={onUploading}
        initialImages={initialImages}
      />
      <h3>Tipos de ingresso e lotes</h3>
      <p className="small">
        Crie opções como Inteira, Meia, Dupla ou Lote 1. Quantidades representam
        lugares individuais. Para uma dupla, limite o pedido a dois ingressos e
        informe o preço por pessoa. A soma das quantidades deve respeitar a
        capacidade da turma.
      </p>
      {ids.map((id, index) => (
        <fieldset className="ticket-editor" key={id}>
          <legend>Ingresso {index + 1}</legend>
          <label className="form-field">
            Nome
            <input
              name={`ticket_${id}_name`}
              defaultValue={initialTickets[id]?.name}
              required
              maxLength={100}
              placeholder="Ex.: Inteira · Lote 1"
            />
          </label>
          <label className="form-field">
            Descrição e condições
            <textarea
              name={`ticket_${id}_description`}
              defaultValue={initialTickets[id]?.description}
              maxLength={500}
              placeholder="Benefícios ou condições deste ingresso"
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              Preço por pessoa (R$)
              <input
                name={`ticket_${id}_price`}
                defaultValue={
                  initialTickets[id] ? initialTickets[id].price_cents / 100 : ""
                }
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0 para gratuito"
              />
            </label>
            <label className="form-field">
              Quantidade de ingressos
              <input
                name={`ticket_${id}_quantity`}
                defaultValue={initialTickets[id]?.quantity}
                type="number"
                min="1"
                max="1000"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              Mínimo por pedido
              <input
                name={`ticket_${id}_min`}
                defaultValue={initialTickets[id]?.min_per_order ?? 1}
                type="number"
                min="1"
                max="1000"
                required
              />
            </label>
            <label className="form-field">
              Máximo por pedido
              <input
                name={`ticket_${id}_max`}
                defaultValue={initialTickets[id]?.max_per_order ?? 1}
                type="number"
                min="1"
                max="1000"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              Disponível a partir de (Brasília)
              <input
                name={`ticket_${id}_start`}
                defaultValue={localDate(
                  initialTickets[id]?.sales_start ?? null,
                )}
                type="datetime-local"
              />
            </label>
            <label className="form-field">
              Disponível até (Brasília)
              <input
                name={`ticket_${id}_end`}
                defaultValue={localDate(initialTickets[id]?.sales_end ?? null)}
                type="datetime-local"
              />
            </label>
          </div>
          {ids.length > 1 && (
            <button
              type="button"
              className="filter"
              disabled={disabled}
              onClick={() =>
                setIds((current) => current.filter((x) => x !== id))
              }
            >
              Remover tipo
            </button>
          )}
        </fieldset>
      ))}
      <input type="hidden" name="ticket_ids" value={JSON.stringify(ids)} />
      <button
        type="button"
        className="button secondary"
        disabled={disabled || ids.length >= 20}
        onClick={() =>
          setIds((current) => [...current, Math.max(...current) + 1])
        }
      >
        + Adicionar tipo de ingresso
      </button>
    </>
  );
}
