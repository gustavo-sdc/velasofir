"use client";

export const paymentPreferenceOptions = [
  ["standard", "Padrão Mercado Pago · meios disponíveis"],
  ["cash", "Cartão · somente 1 parcela"],
  ["installments_3", "Cartão · até 3 parcelas"],
  ["installments_6", "Cartão · até 6 parcelas"],
  ["installments_12", "Cartão · até 12 parcelas"],
  ["no_ticket", "Sem boleto"],
] as const;

export function PaymentPreferenceField({
  defaultValue = "standard",
}: {
  defaultValue?: string;
}) {
  return (
    <label className="form-field">
      Preferência de pagamento
      <select name="payment_preference" defaultValue={defaultValue}>
        {paymentPreferenceOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <span className="small">
        Na carrinho, vale a condição mais restritiva entre os itens.
      </span>
    </label>
  );
}
