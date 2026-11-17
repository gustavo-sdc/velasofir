import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerJourney } from "@/platform/components/customer-journey";
export const metadata = {
  title: "Acompanhamento da compra",
  robots: { index: false, follow: false },
};
export default async function PaymentReturn({
  params,
}: {
  params: Promise<{ status: string }>;
}) {
  const { status } = await params;
  if (!["retorno", "cancelada", "expirada"].includes(status)) notFound();
  if (status === "cancelada") return <CustomerJourney kind="goodbye" />;
  return (
    <div className="container page-content">
      <div className="empty-state">
        <h1>
          {status === "retorno"
            ? "A confirmação está a caminho."
            : status === "expirada"
              ? "O prazo do pagamento terminou."
              : "Você saiu do pagamento."}
        </h1>
        <p>
          {status === "retorno"
            ? "Voltar do pagamento não confirma a compra. O pedido só será confirmado após a verificação do pagamento pelo sistema."
            : "Consulte a equipe antes de tentar novamente, especialmente se já houve algum débito."}
        </p>
        <Link href="/" className="button">
          Voltar à Ofir ↗
        </Link>
      </div>
    </div>
  );
}
