import "server-only";
import { timingSafeEqual, createHash } from "node:crypto";
import {
  checkoutPayload,
  checkoutUrl,
  type VerifiedOrder,
} from "../domain/asaas";
export function asaasConfiguration() {
  const environment = process.env.ASAAS_ENVIRONMENT ?? "sandbox";
  const valid = environment === "sandbox" || environment === "production";
  const enabled =
    environment === "sandbox"
      ? process.env.ASAAS_SANDBOX_ENABLED === "true"
      : process.env.COMMERCE_ENABLED === "true" &&
        process.env.ASAAS_PRODUCTION_APPROVED === "true";
  const hasKey = Boolean(process.env.ASAAS_API_KEY?.trim());
  const hasWebhook = Boolean(
    process.env.ASAAS_WEBHOOK_TOKEN &&
    process.env.ASAAS_WEBHOOK_TOKEN.length >= 32,
  );
  const hasDatabase = Boolean(process.env.SUPABASE_SECRET_KEY?.trim());
  let validOrigin = false;
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    validOrigin =
      origin.protocol === "https:" ||
      (environment === "sandbox" &&
        origin.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(origin.hostname));
  } catch {}
  return {
    environment: valid ? environment : "invalid",
    enabled,
    hasKey,
    hasWebhook,
    hasDatabase,
    validOrigin,
    ready:
      valid && enabled && hasKey && hasWebhook && hasDatabase && validOrigin,
  };
}
export function authenticateAsaasWebhook(token: string | null) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || expected.length < 32 || !token || token.length > 255)
    return false;
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(expected), hash(token));
}
export class AsaasRequestError extends Error {
  constructor(public definiteRejection: boolean) {
    super(
      "Não foi possível concluir a operação no ASAAS. Confira o pedido antes de tentar novamente.",
    );
  }
}
async function asaasRequest(path: string, payload: unknown) {
  const config = asaasConfiguration();
  if (!config.ready)
    throw new Error(
      "Configure a chave, webhook, ambiente e habilitação do ASAAS antes de gerar pagamentos.",
    );
  let response: Response;
  try {
    response = await fetch(
      `${config.environment === "sandbox" ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3"}${path}`,
      {
        method: "POST",
        headers: {
          access_token: process.env.ASAAS_API_KEY!,
          "Content-Type": "application/json",
          "User-Agent": "Ofir/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
        redirect: "error",
      },
    );
  } catch {
    throw new AsaasRequestError(false);
  }
  if (!response.ok)
    throw new AsaasRequestError(
      [400, 401, 403, 404, 422].includes(response.status),
    );
  return response;
}
export async function createAsaasCheckout(order: VerifiedOrder) {
  const response = await asaasRequest(
    "/checkouts",
    checkoutPayload(order, process.env.NEXT_PUBLIC_SITE_URL!),
  );
  try {
    const result = await response.json();
    if (typeof result.id !== "string" || !result.id || result.id.length > 200)
      throw Error();
    return {
      id: result.id,
      url: checkoutUrl(
        result.id,
        asaasConfiguration().environment as "sandbox" | "production",
      ),
    };
  } catch {
    throw new AsaasRequestError(false);
  }
}
export async function cancelAsaasCheckout(id: string) {
  if (!id || id.length > 200) throw new Error("Checkout inválido.");
  await asaasRequest(`/checkouts/${encodeURIComponent(id)}/cancel`, {});
}
