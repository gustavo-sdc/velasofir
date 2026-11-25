"use client";
import { useState, useRef, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost } from "../domain/blog";
import { slugify } from "../site";
import { ImageUpload } from "./image-upload";
import { ArticleBody } from "./article-body";
import { AdminToast } from "./admin-toast";
export function BlogManager({
  posts,
  available,
}: {
  posts: BlogPost[];
  available: boolean;
}) {
  const [selected, setSelected] = useState<BlogPost | null | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState("");
  const router = useRouter();
  const dismissToast = useCallback(() => setToast(""), []);
  return (
    <>
      {toast && (
        <AdminToast
          message={toast}
          tone="success"
          onDismiss={dismissToast}
        />
      )}
      {!available && (
        <p className="notice" role="alert">
          Não foi possível carregar o blog. Confira a conexão antes de publicar.
        </p>
      )}
      {selected === undefined ? (
        <section className="admin-panel">
          <div className="blog-manager-heading">
            <div>
              <h2>Artigos do Universo Ofir</h2>
              <p className="small">
                {posts.filter((p) => p.published).length} publicados ·{" "}
                {posts.filter((p) => !p.published).length} rascunhos
              </p>
            </div>
            <button
              className="button"
              disabled={!available}
              onClick={() => setSelected(null)}
            >
              + Novo artigo
            </button>
          </div>
          <label className="form-field">
            Buscar artigo
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Título ou categoria"
            />
          </label>
          <ul className="admin-list">
            {posts
              .filter((p) =>
                `${p.title} ${p.category}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((p) => (
                <li key={p.id}>
                  <div>
                    <strong>{p.title}</strong>
                    <br />
                    <small>
                      {p.category} · {p.published ? "Publicado" : "Rascunho"} ·
                      Atualizado em{" "}
                      {new Date(p.updated_at).toLocaleDateString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </small>
                  </div>
                  <div className="blog-actions">
                    <button
                      className="button secondary"
                      onClick={() => setSelected(p)}
                    >
                      Editar artigo
                    </button>
                    {p.published && (
                      <a
                        className="text-link"
                        href={`/conteudos/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver no site ↗
                      </a>
                    )}
                  </div>
                </li>
              ))}
          </ul>
          {!posts.length && (
            <p>Nenhum artigo cadastrado. Crie seu primeiro rascunho.</p>
          )}
        </section>
      ) : (
        <BlogEditor
          key={`${selected?.id ?? "new"}-${version}`}
          initial={selected}
          onCancel={() => setSelected(undefined)}
          onSaved={() => {
            setSelected(undefined);
            setVersion((v) => v + 1);
            setToast("Artigo salvo no banco de dados.");
            router.refresh();
          }}
        />
      )}
    </>
  );
}
function BlogEditor({
  initial,
  onSaved,
  onCancel,
}: {
  initial: BlogPost | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [preview, setPreview] = useState(false);
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial?.seo_description ?? "",
  );
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [busy, setBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dismissToast = useCallback(() => setMessage(""), []);
  const textarea = useRef<HTMLTextAreaElement>(null);
  function insert(text: string) {
    const el = textarea.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? start;
    setContent(content.slice(0, start) + text + content.slice(end));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const button = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const published = button?.value === "publish";
    try {
      const response = await fetch("/api/admin/blog", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initial?.id,
          data: {
            ...Object.fromEntries(form),
            title,
            slug: slug || slugify(title),
            excerpt,
            content,
            seo_title: seoTitle,
            seo_description: seoDescription,
            published,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      onSaved();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    } finally {
      setBusy(false);
    }
  }
  const locked = busy || coverBusy || imageBusy;
  return (
    <form className="admin-panel blog-editor" onSubmit={submit}>
      <div className="blog-manager-heading">
        <div>
          <h2>{initial ? "Editar artigo" : "Novo artigo"}</h2>
          <p className="small">
            Escreva para quem lê: uma resposta clara, exemplos reais, fontes
            quando necessário.
          </p>
        </div>
        <button
          type="button"
          className="filter"
          disabled={locked}
          onClick={onCancel}
        >
          Voltar aos artigos
        </button>
      </div>
      <label className="form-field">
        Título do artigo
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!initial) setSlug(slugify(e.target.value).slice(0, 140));
          }}
          required
          minLength={3}
          maxLength={180}
        />
      </label>
      <label className="form-field">
        Endereço da página
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          readOnly={Boolean(initial)}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          minLength={2}
          maxLength={140}
        />
        <span className="small">
          /conteudos/{slug || "seu-artigo"} · O endereço é preservado após o
          primeiro salvamento.
        </span>
      </label>
      <div className="form-row">
        <label className="form-field">
          Categoria
          <input
            name="category"
            defaultValue={initial?.category ?? "Inspiração"}
            required
            maxLength={80}
          />
        </label>
        <label className="form-field">
          Autoria exibida no artigo
          <input
            name="author_name"
            defaultValue={initial?.author_name ?? "Ofir Velas"}
            required
            maxLength={120}
          />
        </label>
      </div>
      <label className="form-field">
        Resumo / resposta principal
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <span className="small">
          Explique o que a leitora vai aprender. Esse texto aparece no início do
          artigo e na listagem.
        </span>
      </label>
      <ImageUpload
        scope="blog"
        maxImages={1}
        disabled={locked}
        onUploading={setCoverBusy}
        initialImages={initial?.cover_image ? [initial.cover_image] : []}
      />
      <label className="form-field">
        Descrição da imagem de capa (texto alternativo)
        <input
          name="cover_alt"
          defaultValue={initial?.cover_alt ?? ""}
          maxLength={250}
          placeholder="Descreva o que aparece na fotografia"
        />
      </label>
      <div
        className="blog-toolbar"
        role="group"
        aria-label="Formatação do artigo"
      >
        <button
          type="button"
          className="filter"
          onClick={() => insert("\n\n## Título da seção\n\n")}
        >
          Título de seção
        </button>
        <button
          type="button"
          className="filter"
          onClick={() => insert("**texto em destaque**")}
        >
          Negrito
        </button>
        <button
          type="button"
          className="filter"
          onClick={() => insert("\n- Primeiro item\n- Segundo item\n")}
        >
          Lista
        </button>
        <button
          type="button"
          className="filter"
          onClick={() => insert("[Texto do link](https://)")}
        >
          Link / fonte
        </button>
        <label className="filter blog-file-button">
          {imageBusy ? "Enviando…" : "+ Imagem no texto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={locked}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setMessage("");
              setImageBusy(true);
              try {
                if (file.size > 5 * 1024 * 1024)
                  throw Error("A imagem deve ter até 5 MB.");
                const data = new FormData();
                data.set("file", file);
                const response = await fetch("/api/admin/blog-images", {
                  method: "POST",
                  body: data,
                });
                const result = await response.json();
                if (!response.ok) throw Error(result.error);
                setContent(
                  (current) =>
                    `${current}\n\n![Descreva esta imagem](${result.url})\n\n`,
                );
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "Falha no upload.",
                );
              } finally {
                setImageBusy(false);
              }
            }}
          />
        </label>
        <button
          type="button"
          className="filter"
          aria-pressed={preview}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Editar texto" : "Pré-visualizar"}
        </button>
      </div>
      {preview ? (
        <div className="article blog-preview">
          <h1>{title || "Título do artigo"}</h1>
          <p className="lead">{excerpt}</p>
          <ArticleBody content={content} />
        </div>
      ) : (
        <label className="form-field">
          Conteúdo
          <textarea
            className="blog-content-input"
            ref={textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={60000}
            rows={20}
            placeholder={
              "Comece com uma resposta direta.\n\n## Desenvolva o assunto\n\nUse parágrafos curtos, listas e exemplos reais.\n\n## Fontes e referências\n\n[Nome da fonte](https://...)"
            }
          />
          <span className="small">
            Use ## para seções e ### para subtítulos. O título principal já é
            criado automaticamente. HTML não é aceito. Nas imagens, substitua
            “Descreva esta imagem” por uma descrição real.
          </span>
        </label>
      )}
      <details>
        <summary>SEO e compartilhamento</summary>
        <label className="form-field">
          Título para buscadores (opcional)
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            maxLength={120}
          />
          <span className="small">
            {(seoTitle || title).length} caracteres · Procure um título claro;
            cerca de 50–60 caracteres é uma referência, não uma regra.
          </span>
        </label>
        <label className="form-field">
          Descrição para buscadores (opcional)
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            maxLength={320}
          />
          <span className="small">
            {(seoDescription || excerpt).length} caracteres · Sem preencher, o
            resumo será usado. Uma descrição concisa costuma funcionar melhor.
          </span>
        </label>
        <div className="blog-search-preview">
          <small>velasofir.com.br › conteudos › {slug}</small>
          <strong>{seoTitle || title || "Título do artigo"}</strong>
          <p>{seoDescription || excerpt || "Resumo do conteúdo"}</p>
        </div>
      </details>
      <p className="notice">
        Antes de publicar: revise a autoria, responda à dúvida principal,
        confira fatos e fontes, descreva as imagens e inclua links relevantes
        para produtos, workshops ou outros guias. Evite repetir palavras-chave
        artificialmente.
      </p>
      {message && (
        <AdminToast
          message={message}
          tone="error"
          onDismiss={dismissToast}
        />
      )}
      <div className="blog-actions">
        <button
          className="button secondary"
          type="submit"
          name="action"
          value={initial?.published ? "publish" : "draft"}
          disabled={locked}
        >
          {initial?.published ? "Salvar alterações" : "Salvar rascunho"}
        </button>
        <button
          className="button"
          type="submit"
          name="action"
          value={initial?.published ? "draft" : "publish"}
          disabled={locked}
        >
          {busy
            ? "Salvando…"
            : initial?.published
              ? "Retirar do ar e salvar rascunho"
              : "Publicar artigo"}
        </button>
        <button
          type="button"
          className="filter"
          disabled={locked}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
