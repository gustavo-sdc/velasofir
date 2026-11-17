import { test } from "node:test";
import assert from "node:assert/strict";
import { blogInput, blogSeo } from "../src/platform/domain/blog.ts";
const draft = {
  title: "Como criar um ritual",
  slug: "como-criar-um-ritual",
  excerpt: "",
  content: "",
  category: "Inspiração",
  author_name: "Ofir Velas",
  cover_image: "",
  cover_alt: "",
  seo_title: "",
  seo_description: "",
  published: false,
};
const published = {
  ...draft,
  excerpt: "Um guia claro para criar um momento seu em casa.",
  content:
    "Um conteúdo original, útil e revisado para quem quer conhecer as velas e seus cuidados. ".repeat(
      3,
    ),
  published: true,
};
test("rascunho pode ser iniciado sem conteúdo, publicação exige resumo e texto", () => {
  assert.equal(blogInput.safeParse(draft).success, true);
  assert.equal(
    blogInput.safeParse({ ...draft, published: true }).success,
    false,
  );
  assert.equal(blogInput.safeParse(published).success, true);
});
test("capa publicada exige alt e não aceita URL executável", () => {
  assert.equal(
    blogInput.safeParse({
      ...published,
      cover_image: "https://example.com/capa.webp",
    }).success,
    false,
  );
  assert.equal(
    blogInput.safeParse({
      ...published,
      cover_image: "https://example.com/capa.webp",
      cover_alt: "Vela artesanal sobre uma mesa",
    }).success,
    true,
  );
  assert.equal(
    blogInput.safeParse({ ...published, cover_image: "javascript:alert(1)" })
      .success,
    false,
  );
});
test("SEO usa o conteúdo visível como padrão e campos de sistema são descartados", () => {
  assert.deepEqual(blogSeo(published), {
    title: published.title,
    description: published.excerpt,
  });
  assert.deepEqual(
    blogSeo({
      ...published,
      seo_title: "Guia Ofir",
      seo_description: "Descrição editorial.",
    }),
    { title: "Guia Ofir", description: "Descrição editorial." },
  );
  const parsed = blogInput.parse({
    ...published,
    published_at: "2000-01-01",
    role: "owner",
  });
  assert.equal("published_at" in parsed, false);
  assert.equal("role" in parsed, false);
});
