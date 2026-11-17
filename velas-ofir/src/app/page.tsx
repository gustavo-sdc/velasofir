import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Flame, Package, Heart } from "lucide-react";
import hero from "@/assets/cha-branco-oficial.png";
import dessert from "@/assets/dessert.png";
import baunilha from "@/assets/baunilha-oficial.png";
import { publishedPosts } from "@/platform/server/blog";
import { products, workshops } from "@/platform/server/catalog";
import { ProductGrid } from "@/platform/components/product-grid";

// eslint-disable-next-line react-refresh/only-export-components
export const metadata = { alternates: { canonical: "/" } };
export const dynamic = "force-dynamic";
export default async function Home() {
  const [catalog, blog] = await Promise.all([
    products(),
    workshops(),
    publishedPosts(),
  ]);
  const photos = catalog.items.filter((item) => item.image);
  //const eventPhoto = events.items.find((event) => event.image)?.image;

  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">OFIR · FEITO À MÃO, PARA SENTIR</span>
          <h1>
            Pequenos rituais.
            <br />
            <em>Grandes</em>
            <br />
            sensações.
          </h1>
          <p>
            Aromas que acolhem. Criações que encantam. Um convite para
            desacelerar e transformar o simples em especial.
          </p>

          <div className="hero-actions">
            <Link href="/loja" className="button">
              Descubra seu aroma <ArrowUpRight size={17} />
            </Link>
            <Link href="/workshops" className="text-link">
              Viva uma experiência ↗
            </Link>
          </div>

          <span className="hero-footnote">
            OFIR · TESOUROS EM FORMATO DE VELAS
          </span>

        </div>

        <div className="brand-hero-visual">
          <div className="brand-hero-photo">
            {photos[0]?.image ? (
              <img
                src={photos[0].image}
                alt={photos[0].name}
                fetchPriority="high"
              />
            ) : (
              <Image
                src={hero}
                alt="Vela artesanal Ofir de chá branco"
                priority
                sizes="(max-width:700px) 90vw, 50vw"
              />
            )}
          </div>
          <span className="brand-seal" aria-hidden="true">
            OFIR.
            <small>
              FEITO À MÃO
              <br />
              COM AFETO
            </small>
          </span>
          {photos[1]?.image && (
            <div className="brand-hero-inset">
              <img src={photos[1].image} alt={photos[1].name} />
              <span>Detalhes que fazem sentir.</span>
            </div>
          )}
          <span className="brand-photo-caption">
            AROMAS, AFETO & PEQUENOS RITUAIS.
          </span>
        </div>
      </section>

      <div className="benefits container">
        <span>
          <Flame size={18} />
          Produção artesanal
        </span>
        <span>
          <Package size={18} />
          Pronta entrega e encomendas
        </span>
        <span>
          <Heart size={18} />
          Cuidado em cada detalhe
        </span>
      </div>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Escolhas que acolhem</span>
            <h2>Sua casa, com mais presença.</h2>
          </div>
          <Link className="text-link" href="/loja">
            Explore a loja <ArrowUpRight size={17} />
          </Link>
        </div>
        {catalog.items.length > 0 ? (
          <ProductGrid items={catalog.items.slice(0, 3)} />
        ) : (
          <div className="collection-grid">
            <Link href="/loja" className="collection-card">
              <div>
                <span className="eyebrow">Fragrâncias para ficar</span>
                <h3>
                  Os pequenos
                  <br />
                  rituais da casa.
                </h3>
                <span className="text-link">
                  Conheça as velas <ArrowUpRight size={16} />
                </span>
              </div>
              <Image
                src={baunilha}
                alt="Vela Ofir de baunilha"
                sizes="(max-width:700px) 90vw, 45vw"
              />
            </Link>
            <Link href="/loja" className="collection-card peach">
              <div>
                <span className="eyebrow">Feito para encantar</span>
                <h3>
                  Um presente.
                  <br />
                  Muitas sensações.
                </h3>
                <span className="text-link">
                  Descubra a Ofir <ArrowUpRight size={16} />
                </span>
              </div>
              <Image
                src={dessert}
                alt="Coleção de velas artesanais Ofir"
                sizes="(max-width:700px) 90vw, 45vw"
              />
            </Link>
          </div>
        )}
      </section>

      <section className={`workshop-banner brand-workshop${video ? " has-photo" : ""}`}
      >
        {video && (
          <div className="brand-workshop-photo">
            <video autoPlay loop muted playsInline aria-label="Experiência presencial Ofir">
              <source src={video} type="video/mp4" />
            </video>
          </div>
        )}
        <div className="container workshop-banner-inner">
          <span className="eyebrow">Experiências Ofir</span>
          <h2>
            Você foi criada
            <br />
            <em>para criar.</em>
          </h2>
          <p>
            Conheça os workshops presenciais da Ofir e descubra o prazer de
            transformar uma ideia em algo seu.
          </p>
          <Link className="button light" href="/workshops">
            Conheça a experiência <ArrowUpRight size={17} />
          </Link>
          <span className="banner-number" aria-hidden="true">
            O.
          </span>
        </div>
      </section>

      <video
        autoPlay
        loop
        muted
        playsInline
        controls
      >
        <source src={video} type="video/mp4" />
      </video>

      <section className="section container brand-journal">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Universo Ofir</span>
            <h2>Um pouco de inspiração.</h2>
          </div>
          <Link className="text-link" href="/conteudos">
            Explore os guias <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="editorial-grid">
          {blog.items.slice(0, 2).map((post) => (
            <Link
              key={post.id}
              href={`/conteudos/${post.slug}`}
              className="editorial-card"
            >
              {post.cover_image && (
                <img
                  className="blog-card-image"
                  src={post.cover_image}
                  alt={post.cover_alt}
                  loading="lazy"
                />
              )}
              <span>{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </section>

      <section className="brand-note container">
        <span className="eyebrow">A ESSÊNCIA DA OFIR</span>
        <p>
          Mais do que perfumar um ambiente.
          <br />
          <em>É sobre como você se sente nele.</em>
        </p>
        <Link href="/sobre" className="text-link">
          Conheça a nossa história <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}
