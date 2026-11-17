import Link from "next/link";
import { youtubeEmbedUrl } from "../domain/youtube";
import { site } from "../site";

export function CustomerJourney({ kind }: { kind: "welcome" | "goodbye" }) {
  const welcome = kind === "welcome";
  const video = youtubeEmbedUrl(
    (welcome
      ? process.env.WELCOME_YOUTUBE_URL
      : process.env.GOODBYE_YOUTUBE_URL) ?? "",
  );
  return (
    <section className="container page-content customer-journey">
      <div className="customer-journey-copy">
        <span className="eyebrow">
          {welcome ? "Um novo encontro com a Ofir" : "Tudo no seu tempo"}
        </span>
        <h1>
          {welcome ? (
            <>
              Que bom ter
              <br />
              você <em>por aqui.</em>
            </>
          ) : (
            <>
              Já está
              <br />
              <em>indo embora?</em>
            </>
          )}
        </h1>
        <p className="lead">
          {welcome
            ? "Bem-vinda ao universo Ofir. Aromas, criações e experiências para transformar pequenos momentos em algo especial."
            : "Seu momento pode esperar. Se ficou alguma dúvida sobre o produto, o workshop ou o pagamento, estamos por aqui para ajudar."}
        </p>
        <div className="hero-actions">
          <Link href="/loja" className="button">
            {welcome ? "Conhecer as criações ↗" : "Voltar para a loja ↗"}
          </Link>
          {welcome ? (
            <Link href="/workshops" className="text-link">
              Descobrir os workshops ↗
            </Link>
          ) : (
            <a
              href={site.whatsapp}
              className="text-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conversar com a Ofir ↗
            </a>
          )}
        </div>
        {!welcome && (
          <p className="small">
            Se você chegou a pagar, fale com a equipe para confirmar a situação
            do pedido antes de tentar novamente. Sair da tela de pagamento não
            solicita reembolso.
          </p>
        )}
      </div>
      {video && (
        <div className="customer-journey-video">
          <iframe
            src={video}
            title={welcome ? "Boas-vindas à Ofir" : "Uma mensagem da Ofir"}
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
    </section>
  );
}
