"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

function browserDatabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
export function StaffLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await browserDatabase().auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error) throw error;
      router.refresh();
    } catch {
      setError(
        "Não foi possível entrar. Confira seus dados ou tente mais tarde.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="auth-card" onSubmit={submit}>
      <span className="eyebrow">Acesso restrito à equipe</span>
      <h1>Bem-vindo à Ofir.</h1>
      <p className="small">
        Use sua conta individual autorizada pela administração.
      </p>
      <label className="form-field">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </label>
      <label className="form-field">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
export function StaffMfa() {
  const [factor, setFactor] = useState("");
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      const db = browserDatabase();
      const { data, error } = await db.auth.mfa.listFactors();
      if (error) throw error;
      const verified = data.totp.find((f) => f.status === "verified");
      if (verified) {
        setFactor(verified.id);
        return;
      }
      for (const f of data.all.filter(
        (f) => f.factor_type === "totp" && f.status === "unverified",
      )) {
        const { error } = await db.auth.mfa.unenroll({ factorId: f.id });
        if (error) throw error;
      }
      const enrolled = await db.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Ofir equipe",
      });
      if (enrolled.error) throw enrolled.error;
      setFactor(enrolled.data.id);
      setQr(enrolled.data.totp.qr_code);
    } catch {
      setError("Não foi possível preparar a verificação. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const code = String(new FormData(event.currentTarget).get("code"));
      const result = await browserDatabase().auth.mfa.challengeAndVerify({
        factorId: factor,
        code,
      });
      if (result.error) throw result.error;
      router.refresh();
    } catch {
      setError("Código inválido ou expirado. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card">
      <span className="eyebrow">Proteção da sua conta</span>
      <h1>Verificação em duas etapas.</h1>
      {!factor ? (
        <>
          <p>
            Prepare seu aplicativo autenticador para liberar o acesso
            administrativo.
          </p>
          <button className="button" onClick={prepare} disabled={busy}>
            {busy ? "Preparando…" : "Continuar"}
          </button>
        </>
      ) : (
        <form onSubmit={verify}>
          {qr && (
            <>
              <p className="small">
                Cadastre este QR Code no seu aplicativo autenticador. Não
                compartilhe esta imagem.
              </p>
              <img
                className="mfa-qr"
                src={qr}
                alt="QR Code para configurar seu autenticador"
              />
            </>
          )}
          <label className="form-field">
            Código do autenticador
            <input
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              minLength={6}
              required
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Verificando…" : "Verificar e entrar"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="button secondary"
        onClick={async () => {
          const { error } = await browserDatabase().auth.signOut();
          if (error) {
            setError("Não foi possível sair. Tente novamente.");
            return;
          }
          router.refresh();
        }}
      >
        Sair da conta
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
