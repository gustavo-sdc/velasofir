import { test } from "node:test";
import assert from "node:assert/strict";
import { workshopInput } from "../src/platform/domain/validation.ts";
import { youtubeEmbedUrl } from "../src/platform/domain/youtube.ts";
const ticket = {
  name: "Inteira",
  description: "",
  price_cents: 20000,
  quantity: 6,
  min_per_order: 1,
  max_per_order: 2,
  sales_start: null,
  sales_end: null,
};
const workshop = {
  title: "Workshop Ofir",
  slug: "workshop-ofir",
  description:
    "  Primeiro parágrafo do evento.\n\n  Segundo parágrafo com  espaços.",
  starts_at: "2099-01-01T10:00:00-03:00",
  location: "Guarulhos, local do evento",
  price_cents: 20000,
  capacity: 10,
  includes: ["Materiais"],
  program: ["Criação artesanal"],
  image: "",
  images: [],
  published: false,
  ticket_types: [
    ticket,
    { ...ticket, name: "Meia", quantity: 4, price_cents: 10000 },
  ],
};
test("workshop preserva espaços e parágrafos e aceita vários tipos de ingresso", () => {
  const parsed = workshopInput.parse(workshop);
  assert.equal(parsed.description, workshop.description);
  assert.equal(parsed.ticket_types.length, 2);
  assert.equal(
    workshopInput.safeParse({
      ...workshop,
      ticket_types: [{ ...ticket, price_cents: 0 }],
    }).success,
    true,
  );
});
test("ingressos respeitam capacidade, nomes e limites por pedido", () => {
  for (const tickets of [
    [ticket, { ...ticket, name: "Meia", quantity: 5 }],
    [ticket, { ...ticket, name: "INTEIRA", quantity: 4 }],
    [{ ...ticket, min_per_order: 3, max_per_order: 2 }],
    [{ ...ticket, max_per_order: 7 }],
    [{ ...ticket, price_cents: -1 }],
  ])
    assert.equal(
      workshopInput.safeParse({ ...workshop, ticket_types: tickets }).success,
      false,
    );
});
test("período de disponibilidade considera fuso e início do evento", () => {
  for (const dates of [
    {
      sales_start: "2098-12-01T10:00:00-03:00",
      sales_end: "2098-12-01T12:00:00Z",
    },
    { sales_start: null, sales_end: "2099-01-02T10:00:00-03:00" },
  ])
    assert.equal(
      workshopInput.safeParse({
        ...workshop,
        ticket_types: [{ ...ticket, ...dates }],
      }).success,
      false,
    );
});

test("YouTube normaliza watch, links curtos, Shorts e embed sem aceitar domínios externos ou HTML", () => {
  const id = "M7lc1UVf-VE";
  const expected = `https://www.youtube-nocookie.com/embed/${id}`;
  for (const url of [
    `https://youtube.com/watch?v=${id}&t=30`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://youtube.com/live/${id}`,
    `https://www.youtube.com/embed/${id}`,
    expected,
  ])
    assert.equal(youtubeEmbedUrl(url), expected);
  for (const url of [
    `https://youtube.com.evil.test/watch?v=${id}`,
    `https://evil.test/embed/${id}`,
    `https://youtube.com@evil.test/watch?v=${id}`,
    `javascript:alert(1)`,
    `http://youtu.be/${id}`,
    `<iframe src="${expected}"></iframe>`,
    `https://youtube.com/watch?v=invalid`,
  ])
    assert.equal(youtubeEmbedUrl(url), null);
});
test("workshop aceita até cinco vídeos, normaliza links e rejeita HTML", () => {
  const url = "https://youtu.be/M7lc1UVf-VE";
  assert.deepEqual(
    workshopInput.parse({ ...workshop, youtube_videos: [url] }).youtube_videos,
    ["https://www.youtube-nocookie.com/embed/M7lc1UVf-VE"],
  );
  assert.deepEqual(workshopInput.parse(workshop).youtube_videos, []);
  assert.equal(
    workshopInput.safeParse({ ...workshop, youtube_videos: Array(6).fill(url) })
      .success,
    false,
  );
  assert.equal(
    workshopInput.safeParse({
      ...workshop,
      youtube_videos: ["<script>alert(1)</script>"],
    }).success,
    false,
  );
});
