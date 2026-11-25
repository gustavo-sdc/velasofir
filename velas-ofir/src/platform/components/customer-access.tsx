"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function database() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

export function CustomerAccess() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    try {
      const db = database();
      if (mode === "login") {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(new URLSearchParams(window.location.search).get("retorno") === "carrinho" ? "/carrinho" : "/conta");
        router.refresh();
        return;
      }
      const { error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: String(form.get("full_name")).trim(),
            birth_date: String(form.get("birth_date")),
            postal_code: String(form.get("postal_code")).trim(),
            street: String(form.get("street")).trim(),
            address_number: String(form.get("address_number")).trim(),
            address_complement: String(form.get("address_complement")).trim(),
            neighborhood: String(form.get("neighborhood")).trim(),
            city: String(form.get("city")).trim(),
            state: String(form.get("state")).trim().toUpperCase(),
          },
        },
      });
      if (error) throw error;
      setMessage("Conta criada. Confirme seu e-mail para acessar sua conta.");
      setMode("login");
    } catch {
      setMessage("Não foi possível concluir. Confira os dados e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <span className="eyebrow">Conta Ofir</span>
      <h1>{mode === "signup" ? "Crie sua conta." : "Entre na sua conta."}</h1>
      <p className="small">Acompanhe seus pedidos, eventos e entregas.</p>
      {mode === "signup" && (
        <>
          <label className="form-field">Nome completo<input name="full_name" autoComplete="name" maxLength={160} required /></label>
          <label className="form-field">Data de nascimento<input name="birth_date" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} required /></label>
        </>
      )}
      <label className="form-field">E-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label className="form-field">Senha<input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} maxLength={256} required /></label>
      {mode === "signup" && (
        <>
          <label className="form-field">CEP<input name="postal_code" autoComplete="postal-code" maxLength={12} required /></label>
          <label className="form-field">Rua<input name="street" autoComplete="address-line1" maxLength={180} required /></label>
          <label className="form-field">Número<input name="address_number" maxLength={30} required /></label>
          <label className="form-field">Complemento<input name="address_complement" maxLength={100} /></label>
          <label className="form-field">Bairro<input name="neighborhood" maxLength={100} required /></label>
          <label className="form-field">Cidade<input name="city" autoComplete="address-level2" maxLength={100} required /></label>
          <label className="form-field">Estado<input name="state" autoComplete="address-level1" maxLength={2} minLength={2} required /></label>
        </>
      )}
      {message && <p role="status" className="form-error">{message}</p>}
      <button className="button" disabled={busy}>{busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}</button>
      <button className="text-link" type="button" onClick={() => { setMessage(""); setMode(mode === "signup" ? "login" : "signup"); }}>
        {mode === "signup" ? "Já tenho conta" : "Criar uma conta"}
      </button>
    </form>
  );
}
