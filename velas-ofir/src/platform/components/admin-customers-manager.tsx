"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, Users } from "lucide-react";
import { money } from "../site";

export type CustomerOrderRecord = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  delivery_address: Record<string, string | null> | null;
  items: { name?: string; ticket_name?: string; quantity?: number }[];
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
};

const paymentLabels: Record<string, string> = {
  pending: "Aguardando pagamento",
  approved: "Pagamento confirmado",
  rejected: "Pagamento recusado",
  cancelled: "Cancelado",
  refunded: "Estornado",
  review: "Em análise",
};
const deliveryLabels: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  payment_confirmed: "Pagamento confirmado",
  preparing: "Preparando pedido",
  shipped: "A caminho",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export function AdminCustomersManager({ orders, available }: { orders: CustomerOrderRecord[]; available: boolean }) {
  const [search, setSearch] = useState("");
  const customers = useMemo(() => {
    const grouped = new Map<string, { name: string; email: string; address: CustomerOrderRecord["delivery_address"]; orders: CustomerOrderRecord[] }>();
    for (const order of orders) {
      const key = order.customer_id || order.customer_email.toLowerCase();
      const customer = grouped.get(key) ?? {
        name: order.customer_name,
        email: order.customer_email,
        address: order.delivery_address,
        orders: [],
      };
      customer.orders.push(order);
      if (!customer.address && order.delivery_address) customer.address = order.delivery_address;
      grouped.set(key, customer);
    }
    return [...grouped.entries()]
      .map(([id, customer]) => ({ id, ...customer }))
      .filter((customer) => `${customer.name} ${customer.email} ${customer.orders.map((order) => order.id).join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [orders, search]);

  return (
    <section className="admin-panel">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mb-1">Clientes e compras</h2>
          <p className="small">Dados e histórico dos clientes que fizeram pedidos.</p>
        </div>
        <span className="status">{customers.length} {customers.length === 1 ? "cliente" : "clientes"}</span>
      </div>
      <label className="form-field mb-5 block max-w-[34rem]">
        Buscar cliente ou pedido
        <span className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" size={16} aria-hidden="true" />
          <input className="w-full pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, e-mail ou ID do pedido" />
        </span>
      </label>
      {!available ? (
        <p className="notice" role="alert">Não foi possível carregar os clientes. Atualize o painel ou confira o acesso ao banco.</p>
      ) : customers.length === 0 ? (
        <div className="empty-state grid justify-items-center py-10 text-center">
          <Users className="mb-3 text-[#777]" aria-hidden="true" />
          <h3>{search ? "Nenhum cliente encontrado" : "Ainda não há clientes com pedidos"}</h3>
          <p>Os dados dos clientes aparecerão aqui quando houver compras registradas.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {customers.map((customer) => {
            const units = customer.orders.reduce((sum, order) => sum + order.items.reduce((count, item) => count + (Number(item.quantity) || 0), 0), 0);
            const address = customer.address;
            const addressText = address ? [
              [address.street, address.address_number].filter(Boolean).join(", "),
              address.address_complement,
              address.neighborhood,
              [address.city, address.state].filter(Boolean).join(" / "),
              address.postal_code && `CEP ${address.postal_code}`,
            ].filter(Boolean).join(" · ") : "Endereço não registrado no pedido";
            return (
              <details className="group rounded-lg border border-[#e5e5e5] bg-white" key={customer.id}>
                <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,auto)_auto] sm:gap-5 sm:px-5">
                  <span className="min-w-0"><strong className="block truncate text-sm">{customer.name}</strong><small className="block truncate text-[#777]">{customer.email}</small></span>
                  <span className="text-xs text-[#555]">{customer.orders.length} {customer.orders.length === 1 ? "pedido" : "pedidos"}</span>
                  <span className="hidden text-xs text-[#555] sm:block">{units} {units === 1 ? "unidade" : "unidades"}</span>
                  <span className="hidden text-xs text-[#555] sm:block">Última compra: {new Date(customer.orders[0].created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                  <ChevronDown size={16} className="text-[#777] transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="grid gap-4 border-t border-[#eee] p-4 sm:p-5">
                  <div><strong className="text-xs">Endereço informado na compra mais recente</strong><p className="mt-1 text-xs leading-5 text-[#666]">{addressText}</p></div>
                  <div className="admin-table-wrap">
                    <table className="admin-table min-w-[48rem]">
                      <thead><tr><th>Data e pedido</th><th>Itens e quantidade</th><th>Total</th><th>Pagamento</th><th>Entrega</th></tr></thead>
                      <tbody>{customer.orders.map((order) => (
                        <tr key={order.id}>
                          <td>{new Date(order.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}<br /><small title={order.id}>{order.id.slice(0, 8)}</small></td>
                          <td>{order.items.map((item, index) => <span className="block" key={`${order.id}-${index}`}>{Number(item.quantity) || 0}× {item.name || "Item do pedido"}{item.ticket_name ? ` — ${item.ticket_name}` : ""}</span>)}</td>
                          <td>{money(Number(order.total_cents || 0) / 100)}</td>
                          <td><span className="status">{paymentLabels[order.payment_status] ?? order.payment_status}</span></td>
                          <td><span className="status">{deliveryLabels[order.fulfillment_status] ?? order.fulfillment_status}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
