"use client";
import { useCallback, useState } from "react";
import { AdminToast } from "./admin-toast";
export function ImageUpload({
  scope,
  disabled,
  onUploading,
  initialImages = [],
  maxImages = 8,
}: {
  scope: "product" | "workshop" | "blog";
  disabled: boolean;
  onUploading: (busy: boolean) => void;
  initialImages?: string[];
  maxImages?: number;
}) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dismissError = useCallback(() => setError(""), []);
  const dismissSuccess = useCallback(() => setSuccess(""), []);
  return (
    <>
      <h3>
        {scope === "blog"
          ? "Capa do artigo"
          : scope === "product"
            ? "Foto do produto"
            : "Imagens do evento"}
      </h3>
      <p className="small">
        {maxImages === 1
          ? "Escolha uma foto do seu computador."
          : `Até ${maxImages} fotos. A primeira será a capa.`}{" "}
        JPG, PNG ou WebP, até 5 MB cada. As imagens enviadas serão públicas.
      </p>
      <input
        type="hidden"
        name={
          scope === "blog"
            ? "cover_image"
            : scope === "product"
              ? "image"
              : "images"
        }
        value={
          scope !== "workshop" ? (images[0] ?? "") : JSON.stringify(images)
        }
      />
      {scope === "product" && (
        <input type="hidden" name="images" value={JSON.stringify(images)} />
      )}
      <label className="form-field">
        Enviar imagens
        <input
          type="file"
          multiple={maxImages > 1}
          accept="image/jpeg,image/png,image/webp"
          disabled={
            disabled ||
            uploading ||
            (maxImages > 1 && images.length >= maxImages)
          }
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            setError("");
            setSuccess("");
            if (
              files.length > maxImages ||
              (maxImages > 1 && files.length + images.length > maxImages)
            ) {
              setError(`O limite é de ${maxImages} imagem(ns).`);
              return;
            }
            setUploading(true);
            onUploading(true);
            try {
              for (const file of files) {
                if (file.size > 5 * 1024 * 1024)
                  throw Error("Use imagens de até 5 MB cada.");
                const data = new FormData();
                data.set("file", file);
                const response = await fetch(`/api/admin/${scope}-images`, {
                  method: "POST",
                  body: data,
                });
                const result = await response.json();
                if (!response.ok) throw Error(result.error);
                setImages((current) =>
                  maxImages === 1 ? [result.url] : [...current, result.url],
                );
              }
              if (files.length)
                setSuccess(
                  files.length === 1
                    ? "Imagem enviada com sucesso."
                    : "Imagens enviadas com sucesso.",
                );
            } catch (error) {
              setError(
                error instanceof Error ? error.message : "Falha no upload.",
              );
            } finally {
              setUploading(false);
              onUploading(false);
            }
          }}
        />
      </label>
      {uploading && <p role="status">Enviando imagens…</p>}
      {error && (
        <AdminToast message={error} tone="error" onDismiss={dismissError} />
      )}
      {success && (
        <AdminToast
          message={success}
          tone="success"
          onDismiss={dismissSuccess}
        />
      )}
      <div className="workshop-upload-grid">
        {images.map((url, i) => (
          <div key={url}>
            <img
              src={url}
              alt={`Imagem ${i + 1} ${scope === "blog" ? "do artigo" : scope === "product" ? "do produto" : "do workshop"}`}
            />
            <small>{i === 0 ? "Capa" : "Galeria"}</small>
            <button
              type="button"
              className="filter"
              disabled={disabled || uploading}
              onClick={() =>
                setImages((current) => current.filter((x) => x !== url))
              }
            >
              Remover da seleção
            </button>
            {i > 0 && (
              <button
                type="button"
                className="filter"
                disabled={disabled || uploading}
                onClick={() =>
                  setImages((current) => [
                    url,
                    ...current.filter((x) => x !== url),
                  ])
                }
              >
                Usar como capa
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
