import { Breadcrumb, EmptyState } from "@/platform/components/shell";
import { ProductGrid } from "@/platform/components/product-grid";
import { products } from "@/platform/server/catalog";
export const metadata = {
  title: "Loja de velas artesanais",
  description:
    "Explore as velas Ofir. Confira produtos a pronta entrega e sob encomenda, fragrâncias e detalhes de cada criação.",
  alternates: { canonical: "/loja" },
};
export const dynamic = "force-dynamic";
export default async function Store() {
  const catalog = await products();
  return (
    <div className="container page-content">
      <Breadcrumb items={[{ title: "Loja" }]} />
      <div className="page-heading">
        <span className="eyebrow">Feitas à mão. Escolhidas por você.</span>
        <h1>
          Seu próximo
          <br />
          <em>pequeno ritual.</em>
        </h1>
        <p>
          Explore fragrâncias, encontre um presente ou escolha um cuidado para a
          sua casa.
        </p>
      </div>
      {catalog.items.length > 0 ? (
        <ProductGrid items={catalog.items} />
      ) : (
        <EmptyState
          title={
            catalog.state === "unavailable"
              ? "Não conseguimos carregar a coleção."
              : "Estamos preparando a vitrine."
          }
        >
          {catalog.state === "unavailable"
            ? "Tente novamente em alguns instantes ou fale com a gente para conhecer os produtos."
            : "Enquanto isso, nossa equipe pode ajudar você a encontrar sua próxima vela."}
        </EmptyState>
      )}
    </div>
  );
}
