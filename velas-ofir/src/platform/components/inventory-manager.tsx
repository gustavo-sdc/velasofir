"use client";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { money, slugify } from "../site";
import type { TicketType } from "../domain/validation";
import { WorkshopFields } from "./workshop-fields";
import { ImageUpload } from "./image-upload";
export type ProductRow = {
  slug: string | null;
  description: string;
  collection: string;
  image: string;
  accepts_orders: boolean;
  id: string;
  name: string;
  price: number;
  status: string;
  stock_quantity: number | null;
  production_days: number | null;
  published: boolean;
};
export type WorkshopRow = {
  youtube_videos: string[];
  description: string;
  location: string;
  price_cents: number;
  capacity: number;
  includes: string[];
  program: string[];
  image: string;
  images: string[];
  ticket_types: TicketType[];
  slug: string;
  id: string;
  title: string;
  starts_at: string;
  published: boolean;
};
export function InventoryManager({
  products,
  workshops,
  unavailable,
  section = "products",
}: {
  products: ProductRow[];
  workshops: WorkshopRow[];
  unavailable: boolean;
  section?: "products" | "stock" | "workshops";
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [productVersion, setProductVersion] = useState(0);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const productForm = useRef<HTMLFormElement>(null);
  const productDetails = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const form = productForm.current;
    if (!form) return;
    form.reset();
    if (!editingProduct) return;
    if (productDetails.current) productDetails.current.open = true;
    const values: Record<string, string | number | boolean> = {
      name: editingProduct.name,
      slug:
        editingProduct.slug ||
        `${slugify(editingProduct.name)}-${editingProduct.id}`,
      description: editingProduct.description ?? "",
      collection: editingProduct.collection ?? "",
      price: editingProduct.price,
      stock_quantity: editingProduct.stock_quantity ?? "",
      production_days: editingProduct.production_days ?? "",
      accepts_orders: editingProduct.accepts_orders,
      published: editingProduct.published,
    };
    for (const [name, value] of Object.entries(values)) {
      const element = form.elements.namedItem(name);
      if (element instanceof HTMLInputElement && element.type === "checkbox")
        element.checked = Boolean(value);
      else if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
        element.value = String(value);
    }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingProduct, section]);
  const [editing, setEditing] = useState<WorkshopRow | null>(null);
  const workshopForm = useRef<HTMLFormElement>(null);
  const workshopDetails = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const form = workshopForm.current;
    if (!form) return;
    form.reset();
    if (editing) {
      if (workshopDetails.current) workshopDetails.current.open = true;
      const values: Record<string, string | boolean> = {
        title: editing.title,
        description: editing.description,
        youtube_videos: (editing.youtube_videos ?? []).join("\n"),
        location: editing.location,
        capacity: String(editing.capacity),
        includes: editing.includes.join("\n"),
        program: editing.program.join("\n"),
        published: editing.published,
        starts_at: new Date(
          new Date(editing.starts_at).getTime() - 3 * 60 * 60 * 1000,
        )
          .toISOString()
          .slice(0, 16),
      };
      for (const [name, value] of Object.entries(values)) {
        const element = form.elements.namedItem(name);
        if (element instanceof HTMLInputElement && element.type === "checkbox")
          element.checked = Boolean(value);
        else if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement
        )
          element.value = String(value);
      }
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editing, section]);
  const [uploading, setUploading] = useState(false);
  const [workshopVersion, setWorkshopVersion] = useState(0);
  async function togglePublication(
    id: string,
    kind: "product" | "workshop",
    published: boolean,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind, published: !published }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(
        published
          ? "Publicação retirada do site."
          : "Página publicada no site.",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível publicar.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(
    event: FormEvent<HTMLFormElement>,
    kind: "product" | "workshop",
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setMessage("");
    const data = Object.fromEntries(fields);
    let payload: Record<string, unknown>;
    if (kind === "product")
      payload = {
        ...data,
        price: Number(data.price),
        stock_quantity:
          editingProduct && data.stock_quantity === ""
            ? null
            : Number(data.stock_quantity),
        accepts_orders: data.accepts_orders === "on",
        production_days: data.production_days
          ? Number(data.production_days)
          : null,
        published: data.published === "on",
      };
    else {
      const raw = String(data.starts_at); // A equipe informa explicitamente o horário de Brasília, independente do computador.
      const ticketTypes = (JSON.parse(String(data.ticket_ids)) as number[]).map(
        (id) => ({
          name: String(data[`ticket_${id}_name`]),
          description: String(data[`ticket_${id}_description`]),
          price_cents: Math.round(Number(data[`ticket_${id}_price`]) * 100),
          quantity: Number(data[`ticket_${id}_quantity`]),
          min_per_order: Number(data[`ticket_${id}_min`]),
          max_per_order: Number(data[`ticket_${id}_max`]),
          sales_start: data[`ticket_${id}_start`]
            ? `${data[`ticket_${id}_start`]}:00-03:00`
            : null,
          sales_end: data[`ticket_${id}_end`]
            ? `${data[`ticket_${id}_end`]}:00-03:00`
            : null,
        }),
      );
      const images = JSON.parse(String(data.images)) as string[];
      payload = {
        ...data,
        ticket_types: ticketTypes,
        images,
        youtube_videos: String(data.youtube_videos ?? "")
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean),
        image: images[0] ?? "",
        starts_at: `${raw}:00-03:00`,
        price_cents: Math.min(...ticketTypes.map((t) => t.price_cents)),
        capacity: Number(data.capacity),
        includes: String(data.includes)
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        program: String(data.program)
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        published: data.published === "on",
      };
      delete payload.price;
      for (const key of Object.keys(payload))
        if (key.startsWith("ticket_") && key !== "ticket_types")
          delete payload[key];
    }
    try {
      const response = await fetch("/api/admin/catalog", {
        method: (kind === "workshop" ? editing : editingProduct)
          ? "PUT"
          : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          data: payload,
          id: kind === "workshop" ? editing?.id : editingProduct?.id,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Não foi possível salvar.");
      form.reset();
      if (kind === "product") {
        setEditingProduct(null);
        setProductVersion((v) => v + 1);
      }
      if (kind === "workshop") {
        setWorkshopVersion((v) => v + 1);
        setEditing(null);
      }
      setMessage(
        result.path
          ? `Workshop salvo. Página gerada: ${result.path}${payload.published ? "" : " (rascunho; publique para disponibilizar)"}`
          : "Cadastro salvo.",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function updateStock(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const stock = Number(
        new FormData(event.currentTarget).get("stock_quantity"),
      );
      const response = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stock_quantity: stock }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Estoque atualizado.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível atualizar.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {unavailable && (
        <p className="notice">
          O esquema da plataforma ainda precisa ser aplicado ao Supabase da
          Ofir. Nenhuma alteração foi feita nos dados existentes.
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="admin-manager">
        {section !== "workshops" && (
          <section className="admin-panel">
            <h2>{section === "stock" ? "Controle de estoque" : "Produtos"}</h2>
            <ul className="admin-list">
              {products.map((p) => (
                <li key={p.id}>
                  <span>
                    {p.name}
                    <br />
                    <small>
                      {p.stock_quantity === null
                        ? "Estoque a conferir"
                        : `${p.stock_quantity} em estoque`}{" "}
                      · {p.published ? "Publicado" : "Rascunho"}
                    </small>
                  </span>
                  <span>{money(Number(p.price))}</span>
                  {section === "products" && (
                    <button
                      className="filter"
                      disabled={busy || unavailable || uploading}
                      onClick={() => setEditingProduct({ ...p })}
                    >
                      Editar produto
                    </button>
                  )}
                  <button
                    className="filter"
                    disabled={busy || unavailable || uploading}
                    onClick={() =>
                      togglePublication(p.id, "product", p.published)
                    }
                  >
                    {p.published ? "Despublicar" : "Publicar"}
                  </button>
                  <form
                    className="stock-form"
                    onSubmit={(event) => updateStock(event, p.id)}
                  >
                    <label>
                      Quantidade
                      <input
                        aria-label={`Estoque de ${p.name}`}
                        name="stock_quantity"
                        type="number"
                        min="0"
                        max="100000"
                        step="1"
                        required
                        defaultValue={p.stock_quantity ?? ""}
                        placeholder="Conferir"
                      />
                    </label>
                    <button
                      className="button secondary"
                      disabled={busy || unavailable || uploading}
                    >
                      Salvar estoque
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            {!products.length && (
              <p className="small">Nenhum produto disponível para gestão.</p>
            )}
            {section === "products" && (
              <details ref={productDetails}>
                <summary>
                  {editingProduct ? "Editar produto" : "Cadastrar produto"}
                </summary>
                <form
                  ref={productForm}
                  onSubmit={(event) => submit(event, "product")}
                >
                  <label className="form-field">
                    Nome
                    <input name="name" required maxLength={160} />
                  </label>
                  <label className="form-field">
                    Endereço da página (ex.: vela-cha-branco)
                    <input
                      name="slug"
                      readOnly={Boolean(editingProduct)}
                      required
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    />
                  </label>
                  <label className="form-field">
                    Descrição
                    <textarea name="description" required minLength={10} />
                  </label>
                  <label className="form-field">
                    Coleção
                    <input name="collection" />
                  </label>
                  <div className="form-row">
                    <label className="form-field">
                      Preço (R$)
                      <input
                        name="price"
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                      />
                    </label>
                    <label className="form-field">
                      Quantidade pronta
                      <input
                        name="stock_quantity"
                        type="number"
                        required={!editingProduct}
                        min="0"
                        step="1"
                        defaultValue="0"
                      />
                    </label>
                  </div>
                  <ImageUpload
                    key={`${editingProduct?.id ?? "new"}-${productVersion}`}
                    scope="product"
                    maxImages={1}
                    disabled={busy}
                    onUploading={setUploading}
                    initialImages={
                      editingProduct?.image ? [editingProduct.image] : []
                    }
                  />
                  <label>
                    <input name="accepts_orders" type="checkbox" /> Aceitar
                    encomendas quando acabar o estoque
                  </label>
                  <label className="form-field">
                    Prazo de produção (dias úteis)
                    <input
                      name="production_days"
                      type="number"
                      min="1"
                      max="365"
                    />
                  </label>
                  <p className="small">
                    <label>
                      <input name="published" type="checkbox" /> Publicar no
                      site
                    </label>
                  </p>
                  <button
                    className="button"
                    disabled={busy || unavailable || uploading}
                  >
                    {editingProduct ? "Salvar alterações" : "Salvar produto"}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy || uploading}
                      onClick={() => setEditingProduct(null)}
                    >
                      Cancelar edição
                    </button>
                  )}
                </form>
              </details>
            )}
          </section>
        )}
        {section === "workshops" && (
          <section className="admin-panel">
            <h2>Workshops e landing pages</h2>
            <ul className="admin-list">
              {workshops.map((w) => (
                <li key={w.id}>
                  <span>
                    {w.title}
                    <br />
                    <small>
                      {new Date(w.starts_at).toLocaleDateString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}{" "}
                      · {w.published ? "Publicado" : "Rascunho"}
                      {w.published && (
                        <>
                          <br />
                          <a
                            className="text-link"
                            href={`/workshops/${w.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir landing page ↗
                          </a>
                        </>
                      )}
                    </small>
                  </span>
                  <button
                    className="filter"
                    disabled={busy || uploading}
                    onClick={() => {
                      setEditing(w);
                      setWorkshopVersion((v) => v + 1);
                    }}
                  >
                    Editar workshop
                  </button>
                  <button
                    className="filter"
                    disabled={busy || unavailable || uploading}
                    onClick={() =>
                      togglePublication(w.id, "workshop", w.published)
                    }
                  >
                    {w.published ? "Despublicar LP" : "Publicar LP"}
                  </button>
                </li>
              ))}
            </ul>
            {!workshops.length && (
              <p className="small">Nenhuma turma cadastrada.</p>
            )}
            <details ref={workshopDetails}>
              <summary>
                {editing ? "Editar workshop" : "Cadastrar turma"}
              </summary>
              <form
                ref={workshopForm}
                onSubmit={(event) => submit(event, "workshop")}
              >
                <label className="form-field">
                  Título
                  <input name="title" required maxLength={160} />
                </label>
                <p className="notice">
                  Sua landing page será gerada automaticamente com título, foto,
                  programação, itens incluídos, data, local e contato para
                  inscrição. Marque “Publicar no site” para disponibilizá-la.
                </p>
                <label className="form-field">
                  Descrição
                  <textarea name="description" required minLength={20} />
                </label>
                <label className="form-field">
                  Data e hora de Brasília
                  <input name="starts_at" type="datetime-local" required />
                </label>
                <label className="form-field">
                  Local e endereço
                  <input name="location" required minLength={5} />
                </label>
                <label className="form-field">
                  Capacidade total da turma
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    max="1000"
                    required
                  />
                </label>
                <label className="form-field">
                  O que está incluído (um item por linha)
                  <textarea name="includes" required />
                </label>
                <label className="form-field">
                  Programação (um item por linha)
                  <textarea name="program" required />
                </label>
                <WorkshopFields
                  key={workshopVersion}
                  disabled={busy}
                  onUploading={setUploading}
                  initialTickets={editing?.ticket_types}
                  initialImages={editing?.images}
                />
                <label className="form-field">
                  Vídeos do YouTube (opcional, um link por linha)
                  <textarea
                    name="youtube_videos"
                    rows={4}
                    placeholder={
                      "https://www.youtube.com/watch?v=...\nhttps://youtu.be/..."
                    }
                  />
                  <span className="small">
                    Até cinco vídeos. Cole o link do vídeo ou de incorporação,
                    sem código HTML. Os vídeos aparecerão na landing page.
                  </span>
                </label>
                <p className="small">
                  <label>
                    <input name="published" type="checkbox" /> Publicar no site
                  </label>
                </p>
                <button
                  className="button"
                  disabled={busy || unavailable || uploading}
                >
                  {editing ? "Salvar alterações" : "Salvar turma"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="button secondary"
                    disabled={busy || uploading}
                    onClick={() => {
                      setEditing(null);
                      setWorkshopVersion((v) => v + 1);
                    }}
                  >
                    Cancelar edição
                  </button>
                )}
              </form>
            </details>
          </section>
        )}
      </div>
    </>
  );
}
