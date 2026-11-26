import { redirect } from "next/navigation";
import Link from "next/link";
import { sessionDatabase } from "@/platform/server/supabase";
import { SignOut } from "@/platform/components/staff-login";
import { ResumeOrderButton } from "@/platform/components/resume-order-button";
import { money } from "@/platform/site";

const paymentLabels: Record<string, string> = {
  pending: "Aguardando pagamento",
  approved: "Pagamento confirmado",
  rejected: "Pagamento recusado",
  cancelled: "Pagamento cancelado",
  refunded: "Estornado",
  review: "Em análise",
};
const fulfillmentLabels: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  payment_confirmed: "Pagamento confirmado",
  preparing: "Preparando pedido",
  shipped: "A caminho",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};
export default async function CustomerAccountPage() {
  const db = await sessionDatabase();
  if (!db)
    return (
      <div className="container page-content">
        <h1>Conta indisponível</h1>
      </div>
    );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/conta/acessar");
  const [{ data: profile }, { data: orders, error: ordersError }] = await Promise.all([
    db
      .from("customer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    db
      .from("customer_orders")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  let age: number | null = null;
  if (profile?.birth_date) {
    const birth = new Date(`${profile.birth_date}T00:00:00`);
    const today = new Date();
    age =
      today.getFullYear() -
      birth.getFullYear() -
      (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() < birth.getDate())
        ? 1
        : 0);
  }
  return (
    <div className="container page-content customer-account">
      <aside className="customer-account-sidebar" aria-label="Navegação da conta">
        <Link className="customer-account-brand" href="/conta">Minha conta</Link>
        <nav>
          <a className="active" href="#resumo">Visão geral</a>
          <a href="#enderecos">Endereço</a>
          <a href="#historico-de-compras">Meus pedidos</a>
          <Link href="/carrinho">Minha carrinho</Link>
        </nav>
        <div className="customer-account-sidebar-bottom"><SignOut /></div>
      </aside>

      <main className="customer-account-main">
        <header className="customer-account-heading" id="resumo">
          <span className="eyebrow">Área do cliente</span>
          <h1>Olá, {profile?.full_name || user.email}</h1>
          <p>{user.email}{age !== null ? ` · ${age} anos` : ""}</p>
        </header>

        <section className="customer-account-panel" id="enderecos">
          <div className="customer-account-section-heading">
            <div><span className="eyebrow">Entrega</span><h2>Endereço cadastrado</h2></div>
          </div>
          <div className="customer-account-table-wrap">
            <table className="customer-account-table">
              <tbody>
                <tr><th scope="row">Rua e número</th><td>{[profile?.street, profile?.address_number].filter(Boolean).join(", ") || "Não informado"}</td></tr>
                <tr><th scope="row">Complemento</th><td>{profile?.address_complement || "—"}</td></tr>
                <tr><th scope="row">Bairro</th><td>{profile?.neighborhood || "—"}</td></tr>
                <tr><th scope="row">Cidade / Estado</th><td>{[profile?.city, profile?.state].filter(Boolean).join(" / ") || "—"}</td></tr>
                <tr><th scope="row">CEP</th><td>{profile?.postal_code || "—"}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="customer-account-panel" id="historico-de-compras">
          <div className="customer-account-section-heading">
            <div><span className="eyebrow">Acompanhe suas compras</span><h2>Meus pedidos</h2></div>
            <span className="customer-account-count">{orders?.length ?? 0} {orders?.length === 1 ? "pedido" : "pedidos"}</span>
          </div>
          {ordersError && <p className="customer-account-empty" role="alert">Não foi possível carregar seus pedidos agora. Atualize a página em instantes.</p>}
          
          {!ordersError && !orders?.length ? (
              <p className="customer-account-empty">Suas compras de velas e eventos aparecerão aqui.</p>
            ) : !ordersError ? (
              <div className="customer-account-table-wrap">
                <table className="customer-account-table customer-orders-table">
                  <thead><tr><th>Data</th><th>Itens</th><th>Valor</th><th>Pagamento</th><th>Status da entrega</th><th>Ação</th></tr></thead>
                  <tbody>
                    {orders.map((order) => (
                      (() => {
                        const orderDate = new Date(order.created_at).toLocaleDateString("pt-BR");
                        const requestedItems = (order.items as { name: string; quantity: number }[])
                          .map((item) => `${item.quantity}× ${item.name}`)
                          .join(", ");
                        const deliveryAddress = [
                          [profile?.street, profile?.address_number].filter(Boolean).join(", "),
                          profile?.address_complement,
                          profile?.neighborhood,
                          [profile?.city, profile?.state].filter(Boolean).join(" / "),
                          profile?.postal_code && `CEP ${profile.postal_code}`,
                        ].filter(Boolean).join(", ") || "Endereço não cadastrado";
                        const deliveryMessage = [
                          "Olá, Ofir! Gostaria de combinar a entrega do meu pedido.",
                          `Data da compra: ${orderDate}`,
                          `Itens solicitados: ${requestedItems}`,
                          `Endereço de entrega: ${deliveryAddress}`,
                          `ID da compra: ${order.id}`,
                        ].join("\n");
                        const deliveryUrl = `https://wa.me/5511964511999?text=${encodeURIComponent(deliveryMessage)}`;
                        return (
                          <tr key={order.id}>
                            <td>{orderDate}</td>
                            <td>{requestedItems}</td>
                            <td>{money(Number(order.total_cents ?? 0) / 100)}</td>
                            <td><span className="customer-account-status">{paymentLabels[order.payment_status] ?? order.payment_status}</span></td>
                            <td>{fulfillmentLabels[order.fulfillment_status] ?? order.fulfillment_status}</td>
                            <td>
                              {order.payment_status === "pending" ? (
                                <ResumeOrderButton orderId={order.id} />
                              ) : order.payment_status === "approved" ? (
                                <a className="customer-account-delivery-link" href={deliveryUrl} target="_blank" rel="noreferrer" aria-label={`Combinar entrega do pedido ${order.id} pelo WhatsApp`}>Combinar entrega</a>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null
          }
        </section>
      </main>
    </div>
  );
}