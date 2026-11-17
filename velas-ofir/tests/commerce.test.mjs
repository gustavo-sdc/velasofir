import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availability,
  fulfillment,
  distanceKm,
  deliveryMethod,
  isStaffRole,
} from "../src/platform/domain/commerce.ts";

test("estoque pronto pode coexistir com encomendas, com uma entrega após produção", () => {
  assert.equal(availability(3, true), "ready");
  assert.deepEqual(fulfillment(3, 5, true, 7), {
    ready: 3,
    madeToOrder: 2,
    productionDays: 7,
  });
  assert.equal(availability(0, true), "made_to_order");
  assert.equal(availability(0, false), "sold_out");
  assert.equal(availability(null, false), "sold_out");
});
test("não permite vender acima do estoque sem encomenda ou sem prazo definido", () => {
  assert.throws(() => fulfillment(2, 3, false, null), /indisponível/);
  assert.throws(() => fulfillment(0, 1, true, null), /Prazo/);
  for (const qty of [0, -1, 1.5, 21, NaN])
    assert.throws(() => fulfillment(5, qty, true, 3));
});
test("raio de entrega inclui 40 km e encaminha distâncias maiores aos Correios", () => {
  assert.equal(deliveryMethod(40), "local");
  assert.equal(deliveryMethod(40.001), "correios");
  const point = { latitude: -23.45, longitude: -46.53 };
  assert.equal(distanceKm(point, point), 0);
  assert.ok(
    Math.abs(
      distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }) -
        111.195,
    ) < 0.01,
  );
  assert.throws(() => distanceKm(point, { latitude: 91, longitude: 0 }));
  assert.throws(() => deliveryMethod(NaN));
  assert.throws(() => deliveryMethod(-1));
});
test("uma sessão sem papel autorizado não dá acesso à equipe", () => {
  assert.equal(isStaffRole("owner"), true);
  assert.equal(isStaffRole("checkin"), true);
  for (const role of [
    undefined,
    null,
    "authenticated",
    "customer",
    "superadmin",
  ])
    assert.equal(isStaffRole(role), false);
});
