import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
export function ArticleBody({ content }: { content: string }) {
  return (
    <div className="article-body">
      <Markdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          img: ({ src, alt }) =>
            typeof src === "string" && src.startsWith("https://") ? (
              <img src={src} alt={alt ?? ""} loading="lazy" />
            ) : null,
          a: ({ href, children }) => (
            <a
              href={href}
              rel={
                href?.startsWith("https://") ? "noopener noreferrer" : undefined
              }
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="article-table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
