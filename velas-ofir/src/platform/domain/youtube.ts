/** Apenas URLs conhecidas do YouTube; nunca aceita HTML informado pelo usuário. */
export function youtubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    let id: string | null = null;
    if (host === "youtu.be" && parts.length === 1) id = parts[0];
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (
        ["embed", "shorts", "live"].includes(parts[0]) &&
        parts.length === 2
      )
        id = parts[1];
    }
    if (
      ["youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host) &&
      parts[0] === "embed" &&
      parts.length === 2
    )
      id = parts[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null;
  } catch {
    return null;
  }
}
