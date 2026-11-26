"use client";
import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Boxes,
  CalendarDays,
  ShoppingBag,
  Users,
  RotateCcw,
  ArrowUpRight,
  NotebookPen,
  CreditCard,
} from "lucide-react";
import {
  InventoryManager,
  type ProductRow,
  type WorkshopRow,
} from "./inventory-manager";
import { SignOut } from "./staff-login";
import { money } from "../site";
import type { Purchase } from "../server/admin-operations";
import { BlogManager } from "./blog-manager";
import type { BlogPost } from "../domain/blog";
import { CustomerOrdersManager } from "./customer-orders-manager";
import { AdminCustomersManager, type CustomerOrderRecord } from "./admin-customers-manager";
const sections = [
  ["overview", "Visão geral", LayoutDashboard],
  ["products", "Produtos", Package],
  ["stock", "Estoque", Boxes],
  ["workshops", "Workshops e páginas", CalendarDays],
  ["blog", "Blog e conteúdos", NotebookPen],
  ["customer-orders", "Pedidos e entregas", CreditCard],
  ["customers", "Clientes", Users],
  ["orders", "Compras", ShoppingBag],
  ["registrations", "Inscrições", Users],
  ["returns", "Cancelamentos e devoluções", RotateCcw],
] as const;
const statusLabel: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  approved: "Pagamento confirmado",
  awaiting_payment: "Aguardando pagamento",
  payment_confirmed: "Pagamento confirmado",
  preparing: "Preparando pedido",
  shipped: "A caminho",
  delivered: "Entregue",
  canceled: "Cancelado",
  cancelled: "Cancelado",
  rejected: "Recusado",
  review: "Em revisão",
  refunded: "Reembolsado",
};
export function AdminDashboard({
  products,
  workshops,
  unavailable,
  operations,
  customerOrders,
  customerOrdersAvailable,
  email,
  role,
  blogPosts,
  blogAvailable,
}: {
  blogPosts: BlogPost[];
  blogAvailable: boolean;
  products: ProductRow[];
  workshops: WorkshopRow[];
  unavailable: boolean;
  operations: { available: boolean; rows: Purchase[] };
  customerOrders: CustomerOrderRecord[];
  customerOrdersAvailable: boolean;
  email: string;
  role: string;
}) {
  const [section, setSection] = useState("overview");
  const [search, setSearch] = useState("");
  const financial = ["owner", "admin"].includes(role);
  const editing = ["owner", "admin", "editor"].includes(role);
  const paid = operations.rows.filter((r) =>
    ["paid", "approved", "payment_confirmed", "preparing", "shipped", "delivered"].includes(r.status),
  );
  const buyers = new Set(
    paid.filter((r) => r.type === "product").map((r) => r.client_id),
  ).size;
  const tickets = paid
    .filter((r) => r.type === "event_ticket")
    .reduce((s, r) => s + r.quantity, 0);
  const cancellations = operations.rows.filter((r) => ["canceled", "cancelled"].includes(r.status));
  const refunds = operations.rows.filter((r) => r.status === "refunded");
  const rows = operations.rows
    .filter((r) =>
      section === "registrations"
        ? r.type === "event_ticket"
        : section === "returns"
        ? ["canceled", "cancelled", "refunded"].includes(r.status)
          : r.type === "product",
    )
    .filter((r) =>
      `${r.reference ?? r.uuid} ${r.description ?? ""} ${statusLabel[r.status] ?? r.status}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.buy_date.localeCompare(a.buy_date));
  const metrics = [
    ["Pessoas que compraram", buyers],
    ["Inscrições confirmadas", tickets],
    ["Compras canceladas", cancellations.length],
    ["Compras reembolsadas", refunds.length],
  ];
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link href="/admin" className="wordmark">
          OFIR<span>.</span>
        </Link>
        <span className="admin-caption">ADMINISTRAÇÃO</span>
        <nav aria-label="Administração">
          {sections
            .filter(
              ([id]) =>
                (id !== "blog" || editing) &&
                (financial ||
                  !["customer-orders", "customers", "orders", "registrations", "returns"].includes(
                    id,
                  )),
            )
            .map(([id, label, Icon]) => (
              <button
                key={id}
                aria-current={section === id ? "page" : undefined}
                onClick={() => {
                  setSection(id);
                  setSearch("");
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/" target="_blank">
            Ver site <ArrowUpRight size={15} />
          </Link>
          <small>
            {email}
            <br />
            {role}
          </small>
          <SignOut />
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>Ofir / Administração</span>
          <span className="status">Operação online em preparação</span>
        </header>
        <div className="admin-content">
          <div className="admin-page-heading">
            <div>
              <span className="eyebrow">Seu negócio, em um só lugar</span>
              <h1>{sections.find((s) => s[0] === section)?.[1]}</h1>
            </div>
            <span className="small">Atualizado ao abrir o painel</span>
          </div>
          {financial && section === "customer-orders" && (
            <CustomerOrdersManager />
          )}
          {financial && section === "customers" && (
            <AdminCustomersManager orders={customerOrders} available={customerOrdersAvailable} />
          )}
          {section === "overview" && (
            <>
              {financial && (
                <>
                  <div className="admin-metrics">
                    {metrics.map(([label, value]) => (
                      <article key={label}>
                        <span>{label}</span>
                        <strong>{operations.available ? value : "—"}</strong>
                        <small>
                          {operations.available
                            ? "Histórico registrado"
                            : "Dados indisponíveis"}
                        </small>
                      </article>
                    ))}
                  </div>
                  <p className="small">
                    Compradores únicos com compras pagas ou entregues.
                    Inscrições representam a quantidade de ingressos pagos
                    registrada no histórico; não são uma lista nominal de
                    participantes.
                  </p>
                </>
              )}
              <div className="admin-metrics">
                <article>
                  <span>Produtos cadastrados</span>
                  <strong>{unavailable ? "—" : products.length}</strong>
                  <small>
                    {products.filter((p) => p.published).length} publicados
                  </small>
                </article>
                <article>
                  <span>Unidades em estoque</span>
                  <strong>
                    {unavailable
                      ? "—"
                      : products.reduce(
                          (s, p) => s + (p.stock_quantity ?? 0),
                          0,
                        )}
                  </strong>
                  <small>
                    {products.filter((p) => p.stock_quantity === null).length}{" "}
                    produtos com estoque a conferir
                  </small>
                </article>
                <article>
                  <span>Workshops</span>
                  <strong>{unavailable ? "—" : workshops.length}</strong>
                  <small>
                    {workshops.filter((w) => w.published).length} páginas
                    publicadas
                  </small>
                </article>
              </div>
              <section className="admin-panel">
                <h2>Organize sua próxima etapa</h2>
                <p>
                  Cadastre produtos, confira o estoque e crie a página do seu
                  próximo workshop.
                </p>
                <div className="filter-row">
                  <button
                    className="button"
                    onClick={() => setSection("products")}
                  >
                    Gerenciar produtos
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => setSection("workshops")}
                  >
                    Criar workshop e LP
                  </button>
                </div>
                <p className="small">Pedidos pagos aparecem em Pedidos e entregas para atualização do preparo e envio.</p>
              </section>
            </>
          )}
          {editing && section === "blog" && (
            <BlogManager posts={blogPosts} available={blogAvailable} />
          )}
          {editing && ["products", "stock", "workshops"].includes(section) && (
            <InventoryManager
              products={products}
              workshops={workshops}
              unavailable={unavailable}
              section={section as "products" | "stock" | "workshops"}
            />
          )}
          {financial &&
            ["orders", "registrations", "returns"].includes(section) && (
              <section className="admin-panel">
                <h2>
                  {section === "returns"
                    ? "Cancelamentos e reembolsos registrados"
                    : "Histórico de operações"}
                </h2>
                <p className="small">
                  Consulta do histórico existente. Valores são os registrados
                  por compra. Devoluções físicas e inscrições nominais ainda não
                  possuem acompanhamento próprio.
                </p>
                {!operations.available ? (
                  <p className="notice">
                    Não foi possível consultar o histórico. Confira a conexão
                    administrativa do servidor. Nenhum indicador foi estimado.
                  </p>
                ) : (
                  <>
                    <label className="form-field">
                      Buscar por referência ou situação
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Referência da compra ou situação"
                      />
                    </label>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Referência</th>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Quantidade</th>
                            <th>Valor</th>
                            <th>Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.uuid}>
                              <td title={r.uuid}>{r.reference ?? r.uuid.slice(0, 8)}</td>
                              <td>
                                {new Date(r.buy_date).toLocaleDateString(
                                  "pt-BR",
                                  { timeZone: "America/Sao_Paulo" },
                                )}
                              </td>
                              <td>
                                {r.type === "event_ticket" ? "Workshop" : "Produto"}
                                {r.description && <><br /><small>{r.description}</small></>}
                              </td>
                              <td>{r.quantity}</td>
                              <td>{money(Number(r.value))}</td>
                              <td>
                                <span className="status">
                                  {statusLabel[r.status] ?? r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!rows.length && (
                      <div className="empty-state">
                        <h3>Nenhum registro encontrado</h3>
                        <p>
                          As operações aparecerão aqui quando forem registradas.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
        </div>
      </div>
    </div>
  );
}
