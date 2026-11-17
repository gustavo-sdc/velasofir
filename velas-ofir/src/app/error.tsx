"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page-content empty-state">
      <h1>Vamos tentar novamente?</h1>
      <p>Não foi possível carregar esta página agora.</p>
      <button className="button" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
