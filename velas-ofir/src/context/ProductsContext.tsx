/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

// ─────────────────────────────────────────────────────────────────
// Tipo único de produto, usado tanto na Home (App.tsx, como
// "coleção em destaque") quanto no Catálogo (lista completa).
//
// kind: "colecao"  → cards grandes da Home (ex: Dessert Collection)
//       "produto"  → itens da grade do Catálogo (ex: vela Capim Limão)
// ─────────────────────────────────────────────────────────────────

export type ProductStatus = "disponivel" | "encomenda";
export type ProductKind = "colecao" | "produto";

export interface Product {
  id: string;
  name: string;
  collection: string;
  description: string;
  queima: string;
  tamanho: string;
  materiaPrima: string;
  price: number;
  status: ProductStatus;
  image: string; // URL pública (Supabase Storage) ou "" se ainda não tiver
  kind: ProductKind;
  highlight: boolean;
  badge: string;
  order: number;
}

export type ProductInput = Omit<Product, "id">;

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  addProduct: (data: ProductInput) => Promise<void>;
  updateProduct: (id: string, data: ProductInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

const TABLE = "products";
const BUCKET = "products";

// Converte a linha do Postgres (snake_case) para o formato usado no app
function fromRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    collection: (row.collection as string) ?? "",
    description: (row.description as string) ?? "",
    queima: (row.queima as string) ?? "",
    tamanho: (row.tamanho as string) ?? "",
    materiaPrima: (row.materia_prima as string) ?? "",
    price: Number(row.price ?? 0),
    status: (row.status as ProductStatus) ?? "disponivel",
    image: (row.image as string) ?? "",
    kind: (row.kind as ProductKind) ?? "produto",
    highlight: Boolean(row.highlight),
    badge: (row.badge as string) ?? "",
    order: Number(row.order ?? 0),
  };
}

// Converte o formato do app para o formato de colunas do Postgres
function toRow(data: ProductInput) {
  return {
    name: data.name,
    collection: data.collection,
    description: data.description,
    queima: data.queima,
    tamanho: data.tamanho,
    materia_prima: data.materiaPrima,
    price: data.price,
    status: data.status,
    image: data.image,
    kind: data.kind,
    highlight: data.highlight,
    badge: data.badge,
    order: data.order,
  };
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("order", { ascending: true });

      if (!isMounted) return;
      if (error) {
        console.error("Erro ao carregar produtos do Supabase:", error);
      } else {
        setProducts((data ?? []).map(fromRow));
      }
      setLoading(false);
    }

    loadInitial();

    // Realtime: qualquer INSERT/UPDATE/DELETE na tabela atualiza a UI
    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        () => {
          // Forma simples e robusta: re-busca a lista inteira a cada mudança.
          // Para um catálogo de produtos (poucas dezenas de itens), o
          // custo disso é desprezível e evita bugs de merge manual.
          loadInitial();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function addProduct(data: ProductInput) {
    const { error } = await supabase.from(TABLE).insert(toRow(data));
    if (error) throw error;
  }

  async function updateProduct(id: string, data: ProductInput) {
    const { error } = await supabase
      .from(TABLE)
      .update(toRow(data))
      .eq("id", id);
    if (error) throw error;
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  }

  async function uploadImage(file: File): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        uploadImage,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts precisa ser usado dentro de <ProductsProvider>");
  }
  return ctx;
}
