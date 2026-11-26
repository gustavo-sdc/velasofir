"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function ResumeOrderButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function resume() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/mercado-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeOrderId: orderId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível retomar o pagamento.");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível retomar o pagamento.");
      setBusy(false);
    }
  }

  return (
    <span className="customer-account-order-action">
      <button className="customer-account-delivery-link" type="button" disabled={busy} onClick={() => void resume()}>
        {busy ? "Preparando…" : <>Retomar pagamento <ArrowRight size={13} /></>}
      </button>
      {message && <span className="customer-account-order-message" role="status">{message}</span>}
    </span>
  );
}
