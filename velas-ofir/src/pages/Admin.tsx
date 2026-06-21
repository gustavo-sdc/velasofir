import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  useProducts,
  type Product,
  type ProductInput,
  type ProductStatus,
  type ProductKind,
} from "../context/ProductsContext";
import { LogOut, Plus, Pencil, Trash2, X, Upload } from "lucide-react";

const EMPTY_FORM: ProductInput = {
  name: "",
  collection: "",
  description: "",
  queima: "",
  tamanho: "",
  materiaPrima: "Cera de coco",
  price: 0,
  status: "disponivel",
  image: "",
  kind: "produto",
  highlight: false,
  badge: "",
  order: 0,
};

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return session ? <AdminPanel email={session.user.email ?? ""} /> : <LoginScreen />;
}

// ─────────────────────────────────────────────────────────────────
// TELA DE LOGIN
// ─────────────────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email ou senha incorretos.");
    }
    setSubmitting(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white px-4"
      style={{ fontFamily: "'Inria Serif', serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inria+Serif:wght@300;400;700&display=swap');
      `}</style>
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm border border-gray-200 rounded-lg p-8"
      >
        <h1 className="text-3xl font-semibold mb-1">OFIR.</h1>
        <p className="text-sm text-gray-500 mb-6">Painel de produtos</p>

        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 text-sm"
        />

        <label className="block text-sm mb-1">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 text-sm"
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white py-2.5 rounded-md hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAINEL PRINCIPAL (logado)
// ─────────────────────────────────────────────────────────────────
function AdminPanel({ email }: { email: string }) {
  const { products, loading, addProduct, updateProduct, deleteProduct } =
    useProducts();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div
      className="min-h-screen bg-white text-gray-900"
      style={{ fontFamily: "'Inria Serif', serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inria+Serif:wght@300;400;700&display=swap');
      `}</style>

      {/* HEADER */}
      <header className="border-b border-gray-200 px-4 md:px-10 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">OFIR. — Painel</h1>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Novo produto
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="px-4 md:px-10 py-8 max-w-6xl mx-auto">
        {loading ? (
          <p className="text-gray-500">Carregando produtos...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">
            Nenhum produto cadastrado ainda. Clique em "Novo produto" para
            começar.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="border border-gray-200 rounded-lg overflow-hidden flex flex-col"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      Sem foto
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded-full">
                      {p.kind === "colecao" ? "Coleção (Home)" : "Produto (Catálogo)"}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        p.status === "disponivel"
                          ? "bg-black text-white"
                          : "border border-black"
                      }`}
                    >
                      {p.status === "disponivel" ? "Disponível" : "Sob encomenda"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mt-1">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.collection}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
                  <p className="font-medium mt-1">R${p.price}</p>

                  <div className="mt-auto pt-3 flex gap-2">
                    <button
                      onClick={() => setEditing(p)}
                      className="flex-1 flex items-center justify-center gap-1 border border-gray-300 rounded-md py-2 text-sm hover:bg-gray-50 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${p.name}"? Essa ação não pode ser desfeita.`)) {
                          deleteProduct(p.id);
                        }
                      }}
                      className="flex items-center justify-center gap-1 border border-red-200 text-red-600 rounded-md py-2 px-3 text-sm hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {(editing || creating) && (
        <ProductFormModal
          product={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={async (data) => {
            if (editing) {
              await updateProduct(editing.id, data);
            } else {
              await addProduct(data);
            }
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MODAL DE CRIAÇÃO / EDIÇÃO
// ─────────────────────────────────────────────────────────────────
function ProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (data: ProductInput) => Promise<void>;
}) {
  const { uploadImage } = useProducts();
  const [form, setForm] = useState<ProductInput>(
    product
      ? {
          name: product.name,
          collection: product.collection,
          description: product.description,
          queima: product.queima,
          tamanho: product.tamanho,
          materiaPrima: product.materiaPrima,
          price: product.price,
          status: product.status,
          image: product.image,
          kind: product.kind,
          highlight: product.highlight,
          badge: product.badge,
          order: product.order,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      set("image", url);
    } catch {
      setError("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch {
      setError("Falha ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg w-full max-w-lg p-6 my-8"
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold">
            {product ? "Editar produto" : "Novo produto"}
          </h2>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-black transition" />
          </button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* IMAGEM */}
          <div>
            <label className="block text-sm mb-1">Foto do produto</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                {form.image ? (
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-gray-400">Sem foto</span>
                )}
              </div>
              <label className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition">
                <Upload className="w-4 h-4" />
                {uploading ? "Enviando..." : "Enviar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* NOME */}
          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* COLEÇÃO */}
          <div>
            <label className="block text-sm mb-1">Coleção (tag)</label>
            <input
              required
              value={form.collection}
              onChange={(e) => set("collection", e.target.value)}
              placeholder="Ex: Classic Collection"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="block text-sm mb-1">Descrição</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* PREÇO / STATUS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Preço (R$)</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProductStatus)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="disponivel">Disponível</option>
                <option value="encomenda">Sob encomenda</option>
              </select>
            </div>
          </div>

          {/* TAMANHO / QUEIMA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Tamanho</label>
              <input
                value={form.tamanho}
                onChange={(e) => set("tamanho", e.target.value)}
                placeholder="Ex: Tamanho: 110g"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Tempo de queima</label>
              <input
                value={form.queima}
                onChange={(e) => set("queima", e.target.value)}
                placeholder="Ex: Queima: 25h"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* MATÉRIA PRIMA */}
          <div>
            <label className="block text-sm mb-1">Matéria-prima</label>
            <input
              value={form.materiaPrima}
              onChange={(e) => set("materiaPrima", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* ONDE APARECE */}
          <div>
            <label className="block text-sm mb-1">Onde este item aparece</label>
            <select
              value={form.kind}
              onChange={(e) => set("kind", e.target.value as ProductKind)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="produto">Catálogo (grade de produtos)</option>
              <option value="colecao">Home (card de coleção em destaque)</option>
            </select>
          </div>

          {/* BADGE / DESTAQUE */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-sm mb-1">Selo (opcional)</label>
              <input
                value={form.badge}
                onChange={(e) => set("badge", e.target.value)}
                placeholder="Ex: Lançamento"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm pb-2">
              <input
                type="checkbox"
                checked={form.highlight}
                onChange={(e) => set("highlight", e.target.checked)}
              />
              Destaque (maior, na Home)
            </label>
          </div>

          {/* ORDEM */}
          <div>
            <label className="block text-sm mb-1">Ordem de exibição</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Números menores aparecem primeiro.
            </p>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-md py-2.5 text-sm hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 bg-black text-white rounded-md py-2.5 text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
