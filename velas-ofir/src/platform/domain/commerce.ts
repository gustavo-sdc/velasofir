export type Availability = "ready" | "made_to_order" | "sold_out";
export function availability(
  stock: number | null,
  acceptsOrders: boolean,
): Availability {
  if (stock !== null && stock > 0) return "ready";
  return acceptsOrders ? "made_to_order" : "sold_out";
}
export function fulfillment(
  stock: number,
  quantity: number,
  acceptsOrders: boolean,
  productionDays: number | null,
) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20)
    throw new Error("Quantidade inválida.");
  if (!Number.isInteger(stock) || stock < 0)
    throw new Error("Estoque inválido.");
  if (quantity <= stock)
    return { ready: quantity, madeToOrder: 0, productionDays: 0 };
  if (!acceptsOrders) throw new Error("Quantidade indisponível.");
  if (
    !Number.isInteger(productionDays) ||
    productionDays === null ||
    productionDays < 1
  )
    throw new Error("Prazo de produção não configurado.");
  return { ready: stock, madeToOrder: quantity - stock, productionDays };
}
export function distanceKm(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  for (const point of [origin, destination]) {
    if (
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude) ||
      Math.abs(point.latitude) > 90 ||
      Math.abs(point.longitude) > 180
    )
      throw new Error("Coordenadas inválidas.");
  }
  const rad = (n: number) => (n * Math.PI) / 180;
  const a =
    Math.sin(rad(destination.latitude - origin.latitude) / 2) ** 2 +
    Math.cos(rad(origin.latitude)) *
      Math.cos(rad(destination.latitude)) *
      Math.sin(rad(destination.longitude - origin.longitude) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
export function deliveryMethod(
  distance: number,
  radius = 40,
): "local" | "correios" {
  if (
    !Number.isFinite(distance) ||
    distance < 0 ||
    !Number.isFinite(radius) ||
    radius <= 0
  )
    throw new Error("Distância inválida.");
  return distance <= radius ? "local" : "correios";
}
export const staffRoles = [
  "owner",
  "admin",
  "support",
  "editor",
  "checkin",
] as const;
export type StaffRole = (typeof staffRoles)[number];
export function isStaffRole(role: unknown): role is StaffRole {
  return staffRoles.includes(role as StaffRole);
}
