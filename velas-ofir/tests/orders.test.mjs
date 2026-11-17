import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { orderInput } from "../src/platform/domain/orders.ts";
import {
  checkoutEventAmount,
  eventOrderReference,
} from "../src/platform/domain/asaas.ts";

test("pedido não recebe preço unitário do navegador e exige condições/entrega", () => {
  const input = {
    id: randomUUID(),
    kind: "product",
    catalog_id: randomUUID(),
    quantity: 1,
    customer_name: "Cliente teste",
    customer_email: "teste@example.com",
    shipping_cents: 0,
    delivery_description: "Entrega confirmada com endereço e prazo.",
    conditions_confirmed: true,
    expected_total_cents: 3590,
  };
  const parsed = orderInput.parse({ ...input, unit_cents: 1, status: "paid" });
  assert.equal("unit_cents" in parsed, false);
  assert.equal("status" in parsed, false);
  assert.equal(
    orderInput.safeParse({ ...input, conditions_confirmed: false }).success,
    false,
  );
  assert.equal(
    orderInput.safeParse({ ...input, delivery_description: "" }).success,
    false,
  );
  assert.equal(orderInput.safeParse({ ...input, quantity: 0 }).success, false);
});
test("webhook valida total em centavos e usa somente referência/callback da Ofir", () => {
  assert.equal(
    checkoutEventAmount([
      { value: 35.9, quantity: 2 },
      { value: 12.5, quantity: 1 },
    ]),
    8430,
  );
  assert.equal(checkoutEventAmount([{ value: 35.999, quantity: 1 }]), null);
  assert.equal(checkoutEventAmount(undefined), null);
  const id = randomUUID();
  assert.equal(
    eventOrderReference(
      {
        callback: {
          successUrl: `https://velasofir.com.br/compra/retorno?pedido=${id}`,
        },
      },
      "https://velasofir.com.br",
    ),
    id,
  );
  assert.equal(
    eventOrderReference(
      {
        callback: {
          successUrl: `https://evil.test/compra/retorno?pedido=${id}`,
        },
      },
      "https://velasofir.com.br",
    ),
    null,
  );
});
test("reservas, concorrência lógica, idempotência e estados financeiros no PostgreSQL", async (t) => {
  const db = new PGlite();
  const owner = randomUUID();
  const product = randomUUID();
  const workshop = randomUUID();
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $f$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $f$;
      create function auth.jwt() returns jsonb language sql stable as $f$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $f$;
      grant usage on schema auth,public to anon,authenticated,service_role;
      create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
      create function storage.foldername(text) returns text[] language sql immutable as $f$ select (string_to_array($1,'/'))[1:1] $f$;
    `);
    for (const name of [
      "20261112195735_platform_foundation.sql",
      "20261112205418_workshop_tickets_media.sql",
      "20261112215550_asaas_order_flow.sql",
    ])
      await db.exec(
        await readFile(
          new URL("../supabase/migrations/" + name, import.meta.url),
          "utf8",
        ),
      );
    await db.query("insert into auth.users(id) values($1)", [owner]);
    await db.query(
      "insert into public.staff_members(user_id,role) values($1,'owner')",
      [owner],
    );
    await db.query(
      "insert into public.products(id,name,price,stock_quantity,published) values($1,'Vela de teste',35.90,2,true)",
      [product],
    );
    const tickets = [
      {
        name: "Inteira",
        price_cents: 10000,
        quantity: 2,
        min_per_order: 1,
        max_per_order: 2,
        sales_start: null,
        sales_end: null,
      },
    ];
    await db.query(
      "insert into public.workshops(id,slug,title,description,starts_at,location,price_cents,capacity,published,ticket_types) values($1,'teste','Turma de teste','Descrição de teste','2099-01-01','Guarulhos',10000,2,true,$2::jsonb)",
      [workshop, JSON.stringify(tickets)],
    );
    async function role(name, fn) {
      await db.exec(`set role ${name}`);
      try {
        return await fn();
      } finally {
        await db.exec("reset role");
      }
    }
    async function reserve({
      id = randomUUID(),
      env = "sandbox",
      kind = "product",
      qty = 1,
      expected = 3590,
    } = {}) {
      return (
        await role("service_role", () =>
          db.query(
            "select * from public.ofir_reserve_order($1::uuid,$2::uuid,$3,$4,$5::uuid,$6,$7,$8,$9,$10,$11,$12)",
            [
              id,
              owner,
              env,
              kind,
              kind === "product" ? product : workshop,
              kind === "workshop" ? "Inteira" : "",
              qty,
              "Cliente teste",
              "teste@example.com",
              0,
              kind === "product"
                ? "Endereço e prazo de entrega confirmados."
                : "",
              expected,
            ],
          ),
        )
      ).rows[0];
    }
    async function claim(id) {
      return (
        await role("service_role", () =>
          db.query("select public.ofir_claim_checkout($1::uuid) as claimed", [
            id,
          ]),
        )
      ).rows[0].claimed;
    }
    async function event(
      order,
      eventId,
      kind,
      amount = order.total_cents,
      checkout = "checkout-" + order.id,
    ) {
      return (
        await role("service_role", () =>
          db.query(
            "select public.ofir_process_asaas_event($1,$2,$3,$4,$5::uuid,$6) as outcome",
            [eventId, order.environment, kind, checkout, order.id, amount],
          ),
        )
      ).rows[0].outcome;
    }
    async function stock() {
      return (
        await db.query(
          "select stock_quantity from public.products where id=$1",
          [product],
        )
      ).rows[0].stock_quantity;
    }
    await t.test(
      "anon e clientes não executam RPCs nem leem pedidos",
      async () => {
        for (const userRole of ["anon", "authenticated"])
          await role(userRole, async () => {
            await assert.rejects(() =>
              db.query("select public.ofir_claim_checkout($1::uuid)", [
                randomUUID(),
              ]),
            );
            if (userRole === "anon")
              await assert.rejects(() =>
                db.query("select * from public.commerce_orders"),
              );
            else
              assert.equal(
                (await db.query("select * from public.commerce_orders")).rows
                  .length,
                0,
              );
          });
      },
    );
    await t.test(
      "sandbox não altera estoque real; reserva duplicada/claim não duplica checkout",
      async () => {
        const order = await reserve();
        assert.equal(await stock(), 2);
        assert.equal((await reserve({ id: order.id })).id, order.id);
        assert.equal(await claim(order.id), true);
        assert.equal(await claim(order.id), false);
        assert.equal(await event(order, "evt-paid", "CHECKOUT_PAID"), "paid");
        assert.equal(await event(order, "evt-paid", "CHECKOUT_PAID"), "paid");
        await event(order, "evt-old-cancel", "CHECKOUT_CANCELED");
        assert.equal(
          (
            await db.query(
              "select status from public.commerce_orders where id=$1",
              [order.id],
            )
          ).rows[0].status,
          "paid",
        );
        assert.equal(await stock(), 2);
      },
    );
    await t.test(
      "produção reserva estoque, rejeita excesso/preço antigo e libera uma única vez",
      async () => {
        await assert.rejects(() => reserve({ env: "production", expected: 1 }));
        assert.equal(await stock(), 2);
        const order = await reserve({
          env: "production",
          qty: 2,
          expected: 7180,
        });
        assert.equal(await stock(), 0);
        await assert.rejects(() => reserve({ env: "production" }));
        await claim(order.id);
        await event(order, "evt-expired", "CHECKOUT_EXPIRED");
        assert.equal(await stock(), 2);
        await event(order, "evt-expired", "CHECKOUT_EXPIRED");
        await event(order, "evt-cancel-again", "CHECKOUT_CANCELED");
        assert.equal(await stock(), 2);
        assert.equal(
          await event(order, "evt-late-paid", "CHECKOUT_PAID"),
          "late_payment_review",
        );
        assert.equal(await stock(), 2);
      },
    );
    await t.test(
      "workshop respeita capacidade por ambiente; sandbox não ocupa vagas reais",
      async () => {
        const a = await reserve({ kind: "workshop", qty: 2, expected: 20000 });
        await assert.rejects(() =>
          reserve({ kind: "workshop", qty: 1, expected: 10000 }),
        );
        const b = await reserve({
          kind: "workshop",
          env: "production",
          qty: 2,
          expected: 20000,
        });
        await claim(a.id);
        await event(a, "evt-workshop-expired", "CHECKOUT_EXPIRED");
        await claim(b.id);
        assert.equal(
          await event(b, "evt-wrong-amount", "CHECKOUT_PAID", 1),
          "amount_review",
        );
        await assert.rejects(() =>
          reserve({
            kind: "workshop",
            env: "production",
            qty: 1,
            expected: 10000,
          }),
        );
      },
    );
  } finally {
    await db.close();
  }
});
