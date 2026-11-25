import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
export function ArticleBody({ content }: { content: string }) {
  return (
    <div className="[overflow-wrap:anywhere]">
      <Markdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="mb-4 mt-10 text-[1.85rem] leading-tight">{children}</h2>,
          h2: ({ children }) => <h2 className="mb-4 mt-10 text-[1.85rem] leading-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-3 mt-8 text-[1.4rem]">{children}</h3>,
          p: ({ children }) => <p className="mb-5 whitespace-pre-wrap leading-[1.9]">{children}</p>,
          img: ({ src, alt }) =>
            typeof src === "string" && src.startsWith("https://") ? (
              <img className="my-7 h-auto w-full rounded-lg" src={src} alt={alt ?? ""} loading="lazy" />
            ) : null,
          a: ({ href, children }) => (
            <a
              className="underline decoration-[#888] underline-offset-4 hover:decoration-[#171717]"
              href={href}
              rel={
                href?.startsWith("https://") ? "noopener noreferrer" : undefined
              }
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6">{children}</ol>,
          li: ({ children }) => <li className="leading-8">{children}</li>,
          blockquote: ({ children }) => <blockquote className="my-6 border-l-2 border-[#806745] bg-[#f5f1e9] px-5 py-4">{children}</blockquote>,
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-[#dedbd4] bg-[#f3f1ec] p-3 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-[#dedbd4] p-3 text-left">{children}</td>,
          pre: ({ children }) => <pre className="my-5 overflow-x-auto rounded-lg bg-[#f3f1ec] p-4 text-sm">{children}</pre>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
