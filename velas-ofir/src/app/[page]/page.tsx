import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/platform/components/shell";
import { site } from "@/platform/site";
const pages: Record<
  string,
  {
    title: string;
    intro: string;
    sections: {
      title: string;
      text?: string;
      paragraphs?: ReactNode[];
    }[];
  }
> = {
  sobre: {
    title: "Tesouros em formato de velas",
    intro:
      "A Ofir nasceu da vontade de criar e transformar pequenos detalhes em experiências para sentir.",
    sections: [
      {
        title: "A primeira faísca",
        paragraphs: [
          <>
            Nasci em São Paulo, cercada por <strong>movimento</strong> e{" "}
            <strong>possibilidades</strong>, e desde cedo a curiosidade foi o
            que me guiou.
          </>,
          <>
            Sempre gostei de criar, de entender como as coisas funcionam e de
            conquistar o que imaginava. Durante a pandemia, aos 15 anos,
            transformei meu tempo livre em um pequeno grande passo: criei minha
            primeira loja online de miçangas, onde descobri o prazer de dar
            forma às ideias.
          </>,
          <>
            Aos 18, iniciei a faculdade de medicina, atraída pela precisão e
            pela busca constante por aperfeiçoamento. Entre a arte e a ciência,
            encontrei meu <strong>equilíbrio</strong> — e é dessa união que
            nasce a essência de Ofir.
          </>,
        ],
      },
      {
        title: "Feitas à mão, com intenção",
        text: "Nossa história passa pelo fazer artesanal, pelas fragrâncias e pelo cuidado com a casa. Cada criação é um convite para encontrar um momento seu na rotina.",
      },
      {
        title: "Encontre a Ofir",
        text: "Estamos em Guarulhos e atendemos pelo WhatsApp. Conheça nossos produtos e acompanhe as próximas experiências presenciais.",
      },
    ],
  },
  entregas: {
    title: "Entregas e encomendas",
    intro:
      "Cada pedido tem seu tempo. Consulte as condições antes de concluir sua compra.",
    sections: [
      {
        title: "Pronta entrega e sob encomenda",
        text: "Produtos a pronta entrega dependem do estoque disponível. Produtos sob encomenda precisam de um prazo de produção, informado antes da compra. Em pedidos mistos, a proposta é enviar todos os itens juntos após a produção.",
      },
      {
        title: "Entrega própria",
        text: "Faremos entregas em um raio de até 40 km da nossa origem em Guarulhos. A elegibilidade, o valor e o prazo serão confirmados pela equipe antes da compra.",
      },
      {
        title: "Correios",
        text: "Para destinos fora da área de entrega própria, o envio será pelos Correios. O frete depende do CEP e das características do pacote. Consulte a cotação com a equipe.",
      },
    ],
  },
  politicas: {
    title: "Trocas e cancelamentos",
    intro:
      "As condições completas da operação estão em preparação. Antes de comprar, consulte a equipe e receba as regras aplicáveis ao seu pedido.",
    sections: [
      {
        title: "Produtos",
        text: "Se você recebeu um produto avariado, interrompa o uso e entre em contato. Compras online também estão sujeitas ao direito de arrependimento e aos demais direitos previstos no Código de Defesa do Consumidor.",
      },
      {
        title: "Workshops",
        text: "A proposta comercial prevê cancelamento da inscrição até sete dias antes do evento, preservados os direitos legais aplicáveis. As condições de cada turma serão apresentadas antes da inscrição.",
      },
      {
        title: "Atendimento",
        text: "Fale com a Ofir para solicitar atendimento, informar um problema ou esclarecer as condições antes da compra.",
      },
    ],
  },
  privacidade: {
    title: "Sua privacidade",
    intro:
      "A Ofir está preparando sua operação de vendas online. Esta página será complementada com os dados do responsável e os detalhes dos serviços utilizados antes da ativação do checkout.",
    sections: [
      {
        title: "Navegação e atendimento",
        text: "O site utiliza os recursos necessários para exibir páginas e proteger seus serviços. Ao abrir o WhatsApp, você passa a utilizar um serviço externo sujeito às políticas desse fornecedor. Não adicionamos rastreadores publicitários nesta versão.",
      },
      {
        title: "Compras online",
        text: "O checkout ainda não está ativo. Antes do lançamento, informaremos as finalidades, os dados necessários para pagamento e entrega, os fornecedores envolvidos e os canais para exercer seus direitos.",
      },
    ],
  },
  carrinho: {
    title: "Seu carrinho",
    intro:
      "A compra online está sendo preparada. Por enquanto, nossa equipe pode ajudar você com produtos, encomendas e workshops.",
    sections: [],
  },
};
export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const p = pages[page];
  return p
    ? {
        title: p.title,
        alternates: { canonical: `/${page}` },
        ...(page === "carrinho"
          ? { robots: { index: false, follow: false } }
          : {}),
      }
    : { title: "Página não encontrada", robots: { index: false } };
}
export default async function Information({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const p = pages[page];
  if (!p) notFound();
  return (
    <div className="container page-content">
      <Breadcrumb items={[{ title: p.title }]} />
      <article className={`article${page === "sobre" ? " about-article" : ""}`}>
        <span className="eyebrow">
          {page === "sobre" ? "Nossa história" : "Ofir"}
        </span>
        <h1>{p.title}</h1>
        <p className="lead">{p.intro}</p>
        {p.sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            {s.text && <p>{s.text}</p>}
            {s.paragraphs?.map((paragraph, index) => (
              <p key={`${s.title}-${index}`}>{paragraph}</p>
            ))}
          </section>
        ))}
        <a
          className="button"
          target="_blank"
          rel="noopener noreferrer"
          href={site.whatsapp}
        >
          Converse com a Ofir ↗
        </a>
      </article>
    </div>
  );
}
