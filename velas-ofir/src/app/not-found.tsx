import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page-content empty-state">
      <span className="eyebrow">404 / Um novo caminho</span>
      <h1>Essa página não está aqui.</h1>
      <p>Explore a loja ou volte para conhecer a Ofir.</p>
      <Link className="button" href="/">
        Voltar ao início ↗
      </Link>
    </div>
  );
}
