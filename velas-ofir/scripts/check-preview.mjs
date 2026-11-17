import assert from "node:assert/strict";

// Executar contra uma prévia local sem Supabase configurado.
const base = process.argv[2] ?? "http://127.0.0.1:3100";
const pages = [
  ["/", "Um respiro."],
  ["/loja", "Estamos preparando a vitrine."],
  ["/workshops", "Reserve um tempo."],
  ["/conteudos", "Universo"],
  ["/conteudos/como-cuidar-da-sua-vela", "Como cuidar da sua vela"],
  ["/sobre", "Tesouros em formato de velas"],
  ["/entregas", "Entregas e encomendas"],
  ["/politicas", "Trocas e cancelamentos"],
  ["/privacidade", "Sua privacidade"],
  ["/carrinho", "Sua sacola"],
  ["/admin", "Conexão em preparação."],
  ["/sorteador", "Sorteador Ofir"],
];
for (const [path, content] of pages) {
  const response = await fetch(new URL(path, base));
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.ok(html.includes(content), `Conteúdo no HTML inicial: ${path}`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-powered-by"), null);
  if (["/admin", "/carrinho", "/sorteador"].includes(path)) {
    assert.match(html, /name="robots" content="noindex, nofollow"/);
  }
}
const redirect = await fetch(new URL("/catalogo", base), { redirect: "manual" });
assert.equal(redirect.status, 308);
assert.equal(new URL(redirect.headers.get("location"), base).pathname, "/loja");
const sitemap = await (await fetch(new URL("/sitemap.xml", base))).text();
assert.ok(sitemap.includes("https://velasofir.com.br/loja"));
assert.ok(!sitemap.includes("ofirvelas.com.br"));
assert.ok(!sitemap.includes("/admin"));
const robots = await (await fetch(new URL("/robots.txt", base))).text();
assert.ok(robots.includes("Disallow: /admin"));
assert.ok(robots.includes("https://velasofir.com.br/sitemap.xml"));
const missing = await fetch(new URL("/pagina-inexistente", base));
assert.equal(missing.status, 404);
const unauthorized = await fetch(new URL("/api/admin/catalog", base), {
  method: "POST",
  headers: { origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "product", data: {} }),
});
assert.equal(unauthorized.status, 403);
console.log("HTTP: 12 páginas, SEO, headers, redirect, 404 e bloqueio administrativo verificados.");
