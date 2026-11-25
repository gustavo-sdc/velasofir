import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/brand/ofir-logo-white-bg.png";
import { ArrowUpRight } from "lucide-react";
import { site } from "../site";
import { HeaderActions } from "./header-actions";
export function Header() {
  return (
    <>
      <div className="announcement">
        Criada para criar.{" "}
        <span>Tesouros em formato de velas.</span>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="wordmark" aria-label="Ofir, página inicial">
            <Image
              src={logo}
              alt="OFIR."
              priority
              sizes="(max-width: 48rem) 24vw, 8vw"
            />
          </Link>
          <nav aria-label="Navegação principal">
            <Link href="/">Início</Link>
            <Link href="/loja">Loja</Link>
            <Link href="/workshops">Workshops</Link>
            <Link href="/conteudos">Inspire-se</Link>
            <Link href="/sobre">A Ofir</Link>
          </nav>
          <HeaderActions />
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="wordmark">
            <Image src={logo} alt="OFIR." sizes="(max-width: 48rem) 24vw, 9vw" />
          </Link>
          <p>
            Tesouros em formato de velas.
            <br />
            Pequenos rituais para sentir a vida.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <Link href="/loja">Velas e fragrâncias</Link>
          <Link href="/workshops">Workshops presenciais</Link>
          <Link href="/conteudos">Universo Ofir</Link>
        </div>
        <div>
          <h2>Podemos ajudar?</h2>
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer">
            Converse com a Ofir <ArrowUpRight size={14} />
          </a>
          <Link href="/entregas">Entregas e encomendas</Link>
          <Link href="/politicas">Trocas e cancelamentos</Link>
          <Link href="/privacidade">Privacidade</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Ofir Velas</span>
        <span>Tesouros em formato de velas.</span>
        <Link href="/admin">Área da equipe</Link>
      </div>
    </footer>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { title: string; href?: string }[];
}) {
  return (
    <nav className="mb-5 text-xs text-[#777] md:mb-8" aria-label="Caminho da página">
      <Link href="/">Início</Link>
      {items.map((item, i) => (
        <span key={i}>
          {" "}
          /{" "}
          {item.href ? (
            <Link href={item.href}>{item.title}</Link>
          ) : (
            <span aria-current="page">{item.title}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="eyebrow">Tudo no seu tempo</span>
      <h2>{title}</h2>
      <p>{children}</p>
      <a
        className="button secondary"
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
      >
        Fale com a Ofir <ArrowUpRight size={16} />
      </a>
    </div>
  );
}
export function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</g, "\\u003c"),
      }}
    />
  );
}
