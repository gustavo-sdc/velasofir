"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { type CommerceOrder, orderStatus } from "../domain/orders";
import { checkoutUrl } from "../domain/asaas";
import { money } from "../site";
import type { ProductRow, WorkshopRow } from "./inventory-manager";
type Config = {
  environment: string;
  ready: boolean;
  enabled: boolean;
  hasKey: boolean;
  hasWebhook: boolean;
  hasDatabase: boolean;
  validOrigin: boolean;
};
export function AsaasManager({
  products,
  workshops,
}: {
  products: ProductRow[];
  workshops: WorkshopRow[];
}) {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [unmatched, setUnmatched] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [kind, setKind] = useState("product");
  const [catalog, setCatalog] = useState("");
  const [ticket, setTicket] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [shipping, setShipping] = useState("0");
  const router = useRouter();
  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/asaas", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setOrders(result.orders);
      setConfig(result.config);
      setUnmatched(result.unmatchedEvents);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível atualizar.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const id =
      sessionStorage.getItem("ofir-asaas-request") || crypto.randomUUID();
    setRequestId(id);
    void refresh();
  }, []);
  const selected =
    kind === "product"
      ? products.find((p) => p.id === catalog)
      : workshops.find((w) => w.id === catalog);
  const workshop = workshops.find((w) => w.id === catalog);
  const ticketType = workshop?.ticket_types.find((t) => t.name === ticket);
  const price =
    kind === "product"
      ? Number(products.find((p) => p.id === catalog)?.price ?? 0) * 100
      : (ticketType?.price_cents ?? 0);
  const total =
    Math.round(price) * quantity +
    (kind === "product" ? Math.round(Number(shipping) * 100) : 0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMessage("");
    sessionStorage.setItem("ofir-asaas-request", requestId);
    try {
      const response = await fetch("/api/admin/asaas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          kind,
          catalog_id: catalog,
          ticket_name: ticket,
          quantity,
          customer_name: fields.customer_name,
          customer_email: fields.customer_email,
          shipping_cents:
            kind === "product" ? Math.round(Number(shipping) * 100) : 0,
          delivery_description: fields.delivery_description ?? "",
          conditions_confirmed: fields.conditions_confirmed === "on",
          expected_total_cents: total,
        }),
      });
      const result = await response.json();
      if (result.definiteRejection) {
        sessionStorage.removeItem("ofir-asaas-request");
        setRequestId(crypto.randomUUID());
      }
      if (!response.ok) throw Error(result.error);
      if (result.processing) {
        setMessage(result.error);
        await refresh();
        return;
      }
      setMessage(
        result.order.checkout_id
          ? "Pedido registrado. O link de pagamento está na lista abaixo; a confirmação depende do webhook."
          : `Pedido já registrado: ${orderStatus[result.order.status] ?? result.order.status}.`,
      );
      sessionStorage.removeItem("ofir-asaas-request");
      setRequestId(crypto.randomUUID());
      form.reset();
      setCatalog("");
      setTicket("");
      setQuantity(1);
      setShipping("0");
      await refresh();
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Resposta inconclusiva. Confira os pedidos antes de repetir.",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function cancel(order: CommerceOrder) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/asaas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setMessage(result.message);
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Confira o pedido no ASAAS antes de repetir.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="admin-panel">
        <div className="blog-manager-heading">
          <div>
            <h2>Pedidos e pagamentos ASAAS</h2>
            <p className="small">
              Venda assistida: Pix e cartão à vista em página hospedada pelo
              ASAAS. Dados do cartão e CPF são preenchidos diretamente no
              provedor.
            </p>
          </div>
          <button
            className="button secondary"
            type="button"
            disabled={loading || busy}
            onClick={() => void refresh()}
          >
            Atualizar pedidos
          </button>
        </div>
        {loading && <p role="status">Consultando pedidos…</p>}
        {config && (
          <>
            <p className="notice">
              Ambiente:{" "}
              <strong>
                {config.environment === "sandbox"
                  ? "Sandbox · apenas testes"
                  : config.environment}
              </strong>
              . Pedidos de teste não alteram o estoque real nem entram nos
              indicadores de vendas reais.
            </p>
            <ul className="small">
              <li>Chave ASAAS: {config.hasKey ? "preenchida" : "pendente"}</li>
              <li>
                Token do webhook:{" "}
                {config.hasWebhook
                  ? "preenchido; confira o cadastro no ASAAS"
                  : "pendente"}
              </li>
              <li>
                Banco do servidor:{" "}
                {config.hasDatabase ? "configurado" : "pendente"}
              </li>
              <li>
                URL de retorno: {config.validOrigin ? "válida" : "pendente"}
              </li>
              <li>
                Geração de pagamentos:{" "}
                {config.enabled ? "habilitada neste ambiente" : "desativada"}
              </li>
            </ul>
          </>
        )}
        {!config?.ready && (
          <p className="small">
            Para homologar, configure as variáveis ASAAS do sandbox e
            ASAAS_SANDBOX_ENABLED no servidor. Não insira chaves neste
            formulário ou no chat. Cadastre o webhook conforme a documentação do
            projeto.
          </p>
        )}
        {unmatched > 0 && (
          <p className="notice">
            {unmatched} evento(s) aguardando vínculo ou tratamento manual.
            Confira os logs e os pedidos no ASAAS antes de gerar outra cobrança.
          </p>
        )}
      </section>
      <form className="admin-panel" onSubmit={submit}>
        <h2>Gerar link de pagamento</h2>
        <p className="small">
          O preço final é validado no banco. Confirme frete, endereço, prazo e
          condições com a cliente antes de gerar o link.
        </p>
        <div className="form-row">
          <label className="form-field">
            Tipo
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setCatalog("");
                setTicket("");
              }}
            >
              <option value="product">Produto</option>
              <option value="workshop">Ingresso de workshop</option>
            </select>
          </label>
          <label className="form-field">
            {kind === "product" ? "Produto" : "Workshop"}
            <select
              value={catalog}
              required
              onChange={(e) => {
                setCatalog(e.target.value);
                setTicket("");
              }}
            >
              <option value="">Selecione</option>
              {kind === "product"
                ? products
                    .filter((p) => p.published)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                : workshops
                    .filter((w) => w.published)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title}
                      </option>
                    ))}
            </select>
          </label>
        </div>
        {kind === "workshop" && (
          <label className="form-field">
            Tipo / lote de ingresso
            <select
              value={ticket}
              required
              onChange={(e) => setTicket(e.target.value)}
            >
              <option value="">Selecione</option>
              {workshop?.ticket_types.map((t) => (
                <option
                  key={t.name}
                  value={t.name}
                  disabled={t.price_cents <= 0}
                >
                  {t.name} ·{" "}
                  {t.price_cents > 0
                    ? money(t.price_cents / 100)
                    : "Gratuito (sem checkout)"}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="form-row">
          <label className="form-field">
            Nome da cliente
            <input
              name="customer_name"
              required
              minLength={2}
              maxLength={160}
            />
          </label>
          <label className="form-field">
            E-mail da cliente
            <input
              name="customer_email"
              type="email"
              required
              maxLength={254}
            />
          </label>
        </div>
        <div className="form-row">
          <label className="form-field">
            Quantidade
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={kind === "workshop" ? (ticketType?.min_per_order ?? 1) : 1}
              max={
                kind === "workshop"
                  ? Math.min(20, ticketType?.max_per_order ?? 20)
                  : 20
              }
              step="1"
              required
            />
          </label>
          {kind === "product" && (
            <label className="form-field">
              Frete confirmado (R$)
              <input
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                type="number"
                min="0"
                max="10000"
                step="0.01"
                required
              />
            </label>
          )}
        </div>
        {kind === "product" && (
          <label className="form-field">
            Endereço, modalidade e prazo de entrega acordados
            <textarea
              name="delivery_description"
              required
              minLength={10}
              maxLength={1000}
              placeholder="Endereço completo, entrega própria/Correios, prazo de produção e entrega combinados."
            />
          </label>
        )}
        <p className="price">Total previsto: {money(total / 100)}</p>
        {kind === "product" &&
          selected &&
          "production_days" in selected &&
          selected.production_days && (
            <p className="small">
              Produção sob encomenda: até {selected.production_days} dias úteis,
              mais o prazo de entrega informado.
            </p>
          )}
        <p className="small">
          <label>
            <input type="checkbox" name="conditions_confirmed" required />{" "}
            Confirmei com a cliente o item/ingresso, quantidade, valor, entrega
            e condições aplicáveis.
          </label>
        </p>
        <button
          className="button"
          disabled={busy || loading || !config?.ready || !requestId}
        >
          {busy
            ? "Processando…"
            : config?.environment === "sandbox"
              ? "Gerar link de teste"
              : "Gerar link de pagamento"}
        </button>
      </form>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <section className="admin-panel">
        <h2>Pedidos registrados</h2>
        <p className="small">
          A reserva é liberada após confirmação de cancelamento/expiração.
          Resposta inconclusiva mantém a reserva para evitar cobrança duplicada.
          Reembolsos e chargebacks exigem conferência no ASAAS; não são
          automatizados nesta etapa.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Item</th>
                <th>Total</th>
                <th>Situação</th>
                <th>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    {order.id.slice(0, 8)}
                    <br />
                    <small>{order.environment}</small>
                  </td>
                  <td>
                    {order.customer_name}
                    <br />
                    <small>{order.customer_email}</small>
                  </td>
                  <td>
                    {order.item_name}
                    <br />
                    <small>{order.quantity} unidade(s)</small>
                  </td>
                  <td>{money(order.total_cents / 100)}</td>
                  <td>{orderStatus[order.status] ?? order.status}</td>
                  <td>
                    {order.checkout_id &&
                      ["pending", "cancel_requested"].includes(
                        order.status,
                      ) && (
                        <a
                          className="text-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={checkoutUrl(
                            order.checkout_id,
                            order.environment,
                          )}
                        >
                          Abrir pagamento ↗
                        </a>
                      )}
                    {order.checkout_id && order.status === "pending" && (
                      <button
                        className="filter"
                        type="button"
                        disabled={busy || !config?.ready}
                        onClick={() => void cancel(order)}
                      >
                        Solicitar cancelamento
                      </button>
                    )}
                    {["creating", "review"].includes(order.status) && (
                      <small>Conferir no ASAAS; não repetir cobrança.</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length && !loading && (
          <p className="small">Nenhum pedido registrado.</p>
        )}
      </section>
    </>
  );
}
