import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkoutPayload,
  checkoutEvent,
  checkoutUrl,
} from "../src/platform/domain/asaas.ts";
import {
  productInput,
  workshopInput,
} from "../src/platform/domain/validation.ts";
const order = {
  id: "5c762248-20f3-4a76-af7f-35252757b60f",
  items: [{ name: "Vela", quantity: 2, unitCents: 3590 }],
};
test("ASAAS recebe valores exatos em reais e callbacks nunca recebem status de pagamento", () => {
  const payload = checkoutPayload(order, "https://velasofir.com.br");
  assert.equal(payload.items[0].value, 35.9);
  assert.equal(payload.items[0].quantity, 2);
  assert.equal(payload.externalReference, order.id);
  assert.deepEqual(payload.billingTypes, ["PIX", "CREDIT_CARD"]);
  assert.equal(
    payload.callback.successUrl,
    `https://velasofir.com.br/compra/retorno?pedido=${order.id}`,
  );
});
test("recusa preço fracionado em centavos, quantidades inválidas e retorno inseguro", () => {
  assert.throws(() =>
    checkoutPayload(
      { ...order, items: [{ ...order.items[0], unitCents: 1.5 }] },
      "https://velasofir.com.br",
    ),
  );
  assert.throws(() =>
    checkoutPayload(
      { ...order, items: [{ ...order.items[0], quantity: -1 }] },
      "https://velasofir.com.br",
    ),
  );
  assert.throws(() => checkoutPayload(order, "http://velasofir.com.br"));
  assert.throws(() => checkoutPayload(order, "javascript:alert(1)"));
  assert.match(
    checkoutUrl("checkout-id", "sandbox"),
    /^https:\/\/sandbox\.asaas\.com\//,
  );
});
test("eventos preservam id para idempotência e descartam dados pessoais não necessários", () => {
  const event = checkoutEvent({
    id: "evt_1",
    event: "CHECKOUT_PAID",
    checkout: {
      id: "c1",
      status: "PAID",
      customerData: { cpfCnpj: "sensitive" },
    },
    account: { id: "anything" },
  });
  assert.deepEqual(event, {
    id: "evt_1",
    event: "CHECKOUT_PAID",
    checkout: { id: "c1", status: "PAID" },
  });
  assert.throws(() => checkoutEvent({ event: "CHECKOUT_PAID" }));
});
test("cadastro exige prazo de encomenda e foto HTTPS", () => {
  const product = {
    name: "Vela teste",
    slug: "vela-teste",
    description: "Uma vela artesanal de teste.",
    collection: "Essenciais",
    price: 35,
    stock_quantity: 0,
    accepts_orders: true,
    production_days: null,
    image: "",
    published: false,
  };
  assert.equal(productInput.safeParse(product).success, false);
  assert.equal(
    productInput.safeParse({ ...product, production_days: 5 }).success,
    true,
  );
  assert.equal(
    productInput.safeParse({
      ...product,
      production_days: 5,
      image: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    productInput.safeParse({ ...product, production_days: 5, price: 35.999 })
      .success,
    false,
  );
});
test("turmas podem ser passadas, mas exigem capacidade e conteúdo", () => {
  const workshop = {
    title: "Workshop Ofir",
    slug: "workshop-ofir",
    description: "Um encontro presencial para criar.",
    starts_at: "2099-01-01T10:00:00-03:00",
    location: "Guarulhos, endereço de teste",
    price_cents: 20000,
    capacity: 10,
    includes: ["Materiais"],
    program: ["Criação da vela"],
    image: "",
    published: false,
  };
  assert.equal(workshopInput.safeParse(workshop).success, true);
  assert.equal(
    workshopInput.safeParse({ ...workshop, capacity: 0 }).success,
    false,
  );
  assert.equal(
    workshopInput.safeParse({
      ...workshop,
      starts_at: "2020-01-01T10:00:00-03:00",
    }).success,
    true,
  );
});

test("edição de produto mantém estoque desconhecido e valida encomendas", async () => {
  const { productUpdateInput } =
    await import("../src/platform/domain/validation.ts");
  const product = {
    name: "Vela editada",
    slug: "vela-existente",
    description: "Descrição atualizada da vela.",
    collection: "Essenciais",
    price: 45,
    stock_quantity: null,
    accepts_orders: false,
    production_days: null,
    image: "",
    published: true,
  };
  assert.equal(productUpdateInput.parse(product).stock_quantity, null);
  assert.equal(
    productUpdateInput.safeParse({ ...product, accepts_orders: true }).success,
    false,
  );
  assert.equal(
    productUpdateInput.safeParse({
      ...product,
      accepts_orders: true,
      production_days: 5,
    }).success,
    true,
  );
  assert.equal(
    productUpdateInput.safeParse({ ...product, stock_quantity: -1 }).success,
    false,
  );
});
