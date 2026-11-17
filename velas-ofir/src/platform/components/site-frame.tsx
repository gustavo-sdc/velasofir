"use client";
import { usePathname } from "next/navigation";
import { Header, Footer } from "./shell";
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const admin = /^\/admin(?:\/|$)/.test(usePathname());
  return (
    <div className={admin ? "admin-frame" : "storefront"}>
      {!admin && <Header />}
      <main id="conteudo">{children}</main>
      {!admin && <Footer />}
    </div>
  );
}
