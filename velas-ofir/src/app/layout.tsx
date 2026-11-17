import type { Metadata } from "next";
import { JsonLd } from "@/platform/components/shell";
import { site } from "@/platform/site";
import "./globals.css";
import "./brand.css";
import { SiteFrame } from "@/platform/components/site-frame";
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Ofir | Velas artesanais e experiências",
    template: "%s | Ofir",
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
  twitter: { card: "summary", title: site.name, description: site.description },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <SiteFrame>{children}</SiteFrame>
        <JsonLd
          value={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: site.name,
            url: site.url,
          }}
        />
      </body>
    </html>
  );
}
