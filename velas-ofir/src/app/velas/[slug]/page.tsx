import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/platform/server/catalog";
import { Breadcrumb, JsonLd } from "@/platform/components/shell";
import { money, site } from "@/platform/site";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = (await products()).items.find((p) => p.slug === slug);
  return product
    ? {
        title: product.name,
        description: product.description,
        alternates: { canonical: `/velas/${slug}` },
      }
    : { title: "Produto não encontrado", robots: { index: false } };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await products();
  const p = result.items.find((item) => item.slug === slug);
  if (!p) notFound();
  const label = {
    ready: "Pronta entrega",
    made_to_order: "Sob encomenda",
    sold_out: "Esgotado",
  }[p.availability];
  return (
    <div className="container page-content">
      <Breadcrumb
        items={[{ title: "Loja", href: "/loja" }, { title: p.name }]}
      />
      <div className="detail-grid">
        <div className="detail-photo">
          {p.image ? (
            <img src={p.image} alt={p.name} />
          ) : (
            <span>Fotografia em breve</span>
          )}
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{p.collection}</span>
          <h1>{p.name}</h1>
          <span className={`status ${p.availability}`}>{label}</span>
          <p className="price">{money(p.price)}</p>
          <p>{p.description}</p>
          {p.availability === "made_to_order" && (
            <p className="notice">
              {p.productionDays
                ? `Produção em até ${p.productionDays} dias úteis, além do prazo de entrega.`
                : "Consulte o prazo de produção antes de encomendar."}
            </p>
          )}
          <a
            className="button"
            href={`${site.whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre ${p.name}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar com a Ofir ↗
          </a>
          <p className="small">
            A compra online estará disponível em breve. Consulte disponibilidade
            e entrega com a equipe.
          </p>
          <dl className="specs">
            {[
              ["Composição", p.material],
              ["Tamanho", p.size],
              ["Tempo de queima", p.burnTime],
            ]
              .filter(([, value]) => value)
              .map(([title, value]) => (
                <div key={title}>
                  <dt>{title}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <details>
            <summary>Entrega e produção</summary>
            <p>
              Entrega própria em um raio de até 40 km da nossa origem em
              Guarulhos. Para outras regiões, envio pelos Correios. Valores e
              prazos são confirmados antes da compra.
            </p>
          </details>
        </div>
      </div>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          ...(p.image ? { image: p.image } : {}),
          brand: { "@type": "Brand", name: "Ofir" },
        }}
      />
    </div>
  );
}
