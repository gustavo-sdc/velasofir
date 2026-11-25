"use client";

import { useEffect, useState, useCallback } from "react";
import { money } from "../site";
import { AdminToast } from "./admin-toast";

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  delivery_address: Record<string, string>;
  items: { name: string; ticket_name: string; quantity: number }[];
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
};

const fulfillmentLabel: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  payment_confirmed: "Pagamento confirmado",
  preparing: "Preparando pedido",
  shipped: "A caminho",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
const nextStatus: Record<string, string> = {
  payment_confirmed: "preparing",
  preparing: "shipped",
  shipped: "delivered",
};

export function CustomerOrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [busy, setBusy] = useState("");
  const dismissToast = useCallback(() => setToast(null), []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/customer-orders", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setOrders(result.orders);
      return true;
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Erro ao carregar pedidos.",
        tone: "error",
      });
      return false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function advance(order: Order) {
    const status = nextStatus[order.fulfillment_status];
    if (!status) return;
    setBusy(order.id);
    setToast(null);
    try {
      const response = await fetch("/api/admin/customer-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, fulfillment_status: status }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      if (await refresh())
        setToast({ message: "Etapa da entrega atualizada.", tone: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Erro ao atualizar pedido.",
        tone: "error",
      });
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="admin-panel">
      {toast && (
        <AdminToast
          message={toast.message}
          tone={toast.tone}
          onDismiss={dismissToast}
        />
      )}
      <h2>Pedidos e entregas</h2>
      <p className="small">
        O cliente acompanha estas atualizações na conta Ofir. Frete cotado
        manualmente após a compra.
      </p>
      {!orders.length ? (
        <p>Nenhum pedido registrado.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data</th><th>Cliente</th><th>Endereço</th><th>Itens</th>
                <th>Valor</th><th>Pagamento</th><th>Entrega</th><th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                  <td>{order.customer_name}<br /><small>{order.customer_email}</small></td>
                  <td>{[
                    order.delivery_address?.street && `${order.delivery_address.street}, ${order.delivery_address.address_number}`,
                    order.delivery_address?.address_complement,
                    order.delivery_address?.neighborhood,
                    order.delivery_address?.city && `${order.delivery_address.city}/${order.delivery_address.state}`,
                    order.delivery_address?.postal_code,
                  ].filter(Boolean).join(" · ")}</td>
                  <td>{order.items.map((item) => `${item.quantity}× ${item.name}${item.ticket_name ? ` — ${item.ticket_name}` : ""}`).join(", ")}</td>
                  <td>{money(order.total_cents / 100)}</td>
                  <td>{order.payment_status === "approved" ? "Confirmado" : order.payment_status}</td>
                  <td>{fulfillmentLabel[order.fulfillment_status] ?? order.fulfillment_status}</td>
                  <td>
                    {nextStatus[order.fulfillment_status] && (
                      <button
                        className="button"
                        disabled={busy === order.id}
                        onClick={() => void advance(order)}
                      >
                        {busy === order.id
                          ? "Salvando…"
                          : `Marcar: ${fulfillmentLabel[nextStatus[order.fulfillment_status]]}`}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
