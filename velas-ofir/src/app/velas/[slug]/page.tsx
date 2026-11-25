import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/platform/server/catalog";
import { Breadcrumb, JsonLd } from "@/platform/components/shell";
import { ProductPurchase } from "@/platform/components/product-purchase";
import { ProductImageGallery } from "@/platform/components/product-image-gallery";
import { money } from "@/platform/site";
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
  const maxQuantity =
    p.availability === "ready" && p.stockQuantity !== null
      ? Math.min(20, p.stockQuantity)
      : 20;
  const relatedProducts = result.items
    .filter((item) => item.id !== p.id)
    .sort(
      (a, b) =>
        Number(b.collection === p.collection) -
        Number(a.collection === p.collection),
    )
    .slice(0, 4);
  return (
    <main className="mx-auto min-h-[60vh] w-[80%] max-w-[90rem] pb-[8vh] pt-[3vh] md:pt-[5vh]">
      <Breadcrumb
        items={[{ title: "Loja", href: "/loja" }, { title: p.name }]}
      />
      <div className="grid grid-cols-1 items-start gap-x-[7%] gap-y-6 md:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <div className="relative row-start-1 aspect-square overflow-hidden rounded-2xl bg-[#f2f1ee] md:col-start-1 md:row-start-1 md:aspect-[0.92]">
          {p.image ? (
            <img className="size-full object-cover" src={p.image} alt={p.name} />
          ) : (
            <span className="grid size-full place-items-center text-sm text-[#777]">Fotografia em breve</span>
          )}
        </div>

        <aside className="row-start-2 flex min-w-0 flex-col items-start gap-3 md:sticky md:top-[8vh] md:col-start-2 md:row-span-2 md:row-start-1 md:py-5">
          <span className="block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">{p.collection}</span>
          <h1 className="mb-0 text-[clamp(2rem,7vw,3.75rem)] leading-[1.05] tracking-[-0.055em]">{p.name}</h1>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs ${p.availability === "sold_out" ? "bg-[#eee] text-[#626262]" : p.availability === "made_to_order" ? "bg-[#f0e4cd] text-[#70551d]" : "bg-[#eee7d8] text-[#62491e]"}`}>{label}</span>
          <p className="mb-0 text-[clamp(1.7rem,5vw,2.25rem)] font-normal text-[#171717]">{money(p.price)}</p>
          <ProductPurchase
            disabled={p.availability === "sold_out" || p.price <= 0}
            maxQuantity={maxQuantity}
            line={{
              kind: "product",
              catalog_id: p.id,
              name: p.name,
              ticket_name: "",
              quantity: 1,
              unit_cents: Math.round(p.price * 100),
              ...(p.image ? { image: p.image } : {}),
            }}
          />
          <p className="mb-0 text-xs leading-6 text-[#777]">O frete será cotado manualmente após a compra.</p>
          {p.availability === "made_to_order" && (
            <p className="w-full rounded-lg border border-[#e8e2d7] bg-[#f7f5f0] p-4 text-sm leading-6 text-[#655137]">
              {p.productionDays
                ? `Produção em até ${p.productionDays} dias úteis, além do prazo de entrega.`
                : "Consulte o prazo de produção antes de encomendar."}
            </p>
          )}
        </aside>

        <div className="row-start-3 min-w-0 md:col-start-1 md:row-start-2">
          <ProductImageGallery images={p.images} name={p.name} />
        </div>
      </div>

      <section className="mt-12 border-t border-[#e8e5df] pt-8 md:mt-16 md:pt-10" aria-labelledby="product-description-title">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] md:gap-[7%]">
          <div>
            <span className="mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">Sobre a peça</span>
            <h2 className="mb-4 text-[clamp(1.7rem,5vw,2.4rem)]" id="product-description-title">Descrição</h2>
            <p className="mb-0 max-w-[48rem] whitespace-pre-wrap text-[0.95rem] leading-[1.9] text-[#4f4f4f]">{p.description}</p>
          </div>
          <div>
            <dl className="grid grid-cols-1 border-t border-[#e8e5df] sm:grid-cols-3 md:grid-cols-1">
              {[
                ["Composição", p.material],
                ["Tamanho", p.size],
                ["Tempo de queima", p.burnTime],
              ]
                .filter(([, value]) => value)
                .map(([title, value]) => (
                  <div className="border-b border-[#e8e5df] py-3 sm:pr-3 md:pr-0" key={title}>
                    <dt className="text-[0.65rem] uppercase tracking-[0.1em] text-[#777]">{title}</dt>
                    <dd className="mb-0 mt-1 text-sm text-[#222]">{value}</dd>
                  </div>
                ))}
            </dl>
            <details className="w-full border-b border-[#e8e5df] py-4 text-sm">
              <summary className="cursor-pointer font-medium">Entrega e produção</summary>
              <p className="mb-0 mt-3 text-sm leading-6 text-[#666]">
                Entrega própria em um raio de até 40 km da nossa origem em Guarulhos. Para outras regiões, envio pelos Correios. Valores e prazos são confirmados antes da compra.
              </p>
            </details>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-12 border-t border-[#e8e5df] pt-8 md:mt-16 md:pt-10" aria-labelledby="related-products-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <span className="mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">Continue explorando</span>
              <h2 className="mb-0 text-[clamp(1.7rem,5vw,2.4rem)]" id="related-products-title">Outros produtos</h2>
            </div>
            <Link className="hidden text-sm underline underline-offset-4 sm:block" href="/loja">Ver a loja</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <Link className="group min-w-0 overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:-translate-y-1 hover:shadow-lg" href={`/velas/${item.slug}`} key={item.id}>
                <div className="aspect-square overflow-hidden bg-[#f2f1ee]">
                  {item.image ? <img className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" src={item.image} alt={item.name} loading="lazy" /> : <span className="grid size-full place-items-center text-xs text-[#777]">Foto em breve</span>}
                </div>
                <div className="p-3 sm:p-4">
                  <span className="mb-1 block text-[0.58rem] uppercase tracking-[0.12em] text-[#777]">{item.collection || "Feito à mão"}</span>
                  <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-snug sm:text-base">{item.name}</h3>
                  <strong className="text-sm font-semibold text-[#171717]">{money(item.price)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          ...(p.images.length ? { image: p.images } : {}),
          brand: { "@type": "Brand", name: "Ofir" },
        }}
      />
    </main>
  );
}
