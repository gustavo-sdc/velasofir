export const site = {
  name: "Ofir Velas",
  url: "https://velasofir.com.br",
  description:
    "Velas artesanais, fragrâncias para a casa e workshops presenciais. Descubra a Ofir e crie espaço para os seus pequenos rituais.",
  whatsapp: "https://wa.me/5511964511999",
};
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
