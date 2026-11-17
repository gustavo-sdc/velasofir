import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  authenticateAsaasWebhook,
  asaasConfiguration,
} from "@/platform/server/asaas";
import { privilegedDatabase } from "@/platform/server/supabase";
import {
  checkoutEvent,
  checkoutEventAmount,
  eventOrderReference,
} from "@/platform/domain/asaas";
export async function POST(request: Request) {
  if (!authenticateAsaasWebhook(request.headers.get("asaas-access-token")))
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > 250000)
    return NextResponse.json(
      { error: "Evento muito grande." },
      { status: 413 },
    );
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 250000)
      return NextResponse.json(
        { error: "Evento muito grande." },
        { status: 413 },
      );
    const input = JSON.parse(raw);
    const base = z
      .object({
        id: z.string().min(1).max(200),
        event: z.string().min(1).max(100),
      })
      .safeParse(input);
    if (!base.success)
      return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
    const environment = asaasConfiguration().environment;
    if (environment === "invalid") throw Error();
    const db = privilegedDatabase();
    if (
      ![
        "CHECKOUT_CREATED",
        "CHECKOUT_PAID",
        "CHECKOUT_CANCELED",
        "CHECKOUT_EXPIRED",
      ].includes(base.data.event)
    ) {
      const stored = await db
        .from("asaas_events")
        .upsert(
          {
            id: base.data.id,
            environment,
            event_type: base.data.event,
            outcome: "unsupported",
          },
          { onConflict: "id", ignoreDuplicates: true },
        );
      if (stored.error) throw Error();
      return NextResponse.json({ received: true, unsupported: true });
    }
    const event = checkoutEvent(input);
    const result = await db.rpc("ofir_process_asaas_event", {
      p_event_id: event.id,
      p_environment: environment,
      p_event: event.event,
      p_checkout: event.checkout.id,
      p_order: eventOrderReference(
        event.checkout,
        process.env.NEXT_PUBLIC_SITE_URL ?? "",
      ),
      p_amount: checkoutEventAmount(event.checkout.items),
    });
    if (result.error || result.data === "unmatched")
      return NextResponse.json(
        { error: "Evento pendente de conciliação. Reenvie." },
        { status: 503 },
      );
    revalidatePath("/admin");
    revalidatePath("/loja");
    revalidatePath("/workshops", "layout");
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Evento não concluído; reenvie." },
      { status: 503 },
    );
  }
}
