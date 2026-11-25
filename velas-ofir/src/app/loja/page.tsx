import { Breadcrumb } from "@/platform/components/shell";
import { ProductGrid } from "@/platform/components/product-grid";
import { products } from "@/platform/server/catalog";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <main className="mx-auto min-h-[60vh] w-[80%] max-w-[90rem] pb-[8vh] pt-[3vh]">
      <Breadcrumb items={[{ title: "Loja" }]} />
      <section className="grid grid-cols-1 items-center gap-6 pb-[6vh] md:grid-cols-[0.9fr_1.1fr] md:gap-[6%] md:py-[4vh_8vh]" aria-labelledby="store-title">
        <div className="max-w-[35rem] self-center py-3">
          <span className="mb-3 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">Feitas à mão. Escolhidas por você.</span>
          <h1 id="store-title" className="mb-3 text-[clamp(2.7rem,11vw,5rem)] leading-[1.04] tracking-[-0.06em]">Sua próxima paixão...</h1>
          <p className="mb-6 max-w-[27rem] text-[0.95rem] leading-[1.85] text-[#666]">
            Explore fragrâncias, encontre um presente ou escolha um cuidado para a sua casa.
          </p>
          <a className="inline-flex min-h-12 items-center gap-4 rounded-lg bg-[#171717] px-5 py-3 text-sm text-white transition hover:bg-[#333]" href="#vitrine">
            Explorar a loja <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>

        {catalog.items[0] && (
          <Link
            className="group relative block aspect-[4/3] min-w-0 overflow-hidden rounded-[1rem] bg-gradient-to-br from-[#f7f5f0] to-[#e9e5db] md:aspect-[1.15]"
            href={`/velas/${catalog.items[0].slug}`}
            aria-label={`Conheça ${catalog.items[0].name}`}
          >
            {catalog.items[0].image ? (
              <img
                src={catalog.items[0].image}
                className="size-full object-cover transition duration-500 group-hover:scale-[1.035]"
                alt={catalog.items[0].name}
                fetchPriority="high"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-[2.5rem] italic text-[#555]">Ofir</span>
            )}
            <span className="absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto] items-end gap-x-3 gap-y-1 bg-gradient-to-t from-black/75 to-transparent px-5 pb-4 pt-12 text-white">
              <span className="col-span-full text-[0.62rem] uppercase tracking-[0.14em] text-white/85">{catalog.items[0].collection || "Feito à mão"}</span>
              <strong className="text-[1.2rem] font-medium">{catalog.items[0].name}</strong>
              <span aria-hidden="true">↗</span>
            </span>
          </Link>
        )}
      </section>
      
      {catalog.items.length > 0 ? (
        <section
          id="vitrine"
          className="scroll-mt-28"
          aria-labelledby="store-vitrine-title"
        >
          <div className="mb-5">
            <span className="block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#777]">Descubra seu próximo favorito</span>
            <h2 id="store-vitrine-title" className="mt-1 text-[clamp(1.8rem,7vw,2.5rem)] tracking-[-0.04em]">A loja Ofir</h2>
          </div>
          <ProductGrid items={catalog.items} />
        </section>
      ) : (
        <section className="rounded-2xl bg-[#f3f3f3] px-[8%] py-[7vh] text-center">
          <h2 className="text-[clamp(1.8rem,5vw,2.5rem)]">{catalog.state === "unavailable" ? "Não conseguimos carregar a coleção." : "Estamos preparando a vitrine."}</h2>
          <p className="mx-auto mb-6 max-w-[32rem] text-[#555]">{catalog.state === "unavailable" ? "Tente novamente em alguns instantes ou fale com a gente para conhecer os produtos." : "Enquanto isso, nossa equipe pode ajudar você a encontrar sua próxima vela."}</p>
          <Link className="inline-flex items-center gap-3 rounded-lg bg-[#171717] px-5 py-3 text-sm text-white" href="/loja">Voltar à loja <ArrowUpRight size={16} /></Link>
        </section>
      )}
    </main>
  );
}
