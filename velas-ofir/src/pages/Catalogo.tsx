import { useEffect , useState } from "react";
import {  Sparkles,  ShoppingBag, Menu, X, Mail, Phone, Youtube, Instagram, Check, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";


type ProductStatus = "disponivel" | "encomenda";

interface Product {
  id: string;
  name: string;
  collection: string;
  description: string;
  queima: string;
  tamanho: string;
  materia_prima: string;
  price: number;
  status: ProductStatus;
  image: string | null;
}

const STATUS_LABEL: Record<ProductStatus, string> = {
  disponivel: "Disponível",
  encomenda: "Sob encomenda",
};

type FilterValue = "todos" | ProductStatus;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "disponivel", label: "Disponível" },
  { value: "encomenda", label: "Sob encomenda" },
];

function whatsappLink(product: Product) {
  const phone = "5511964511999";
  const msg =
    product.status === "disponivel"
      ? `Olá! Quero comprar a vela ${product.name} (${product.collection}).`
      : `Olá! Gostaria de encomendar a vela ${product.name} (${product.collection}).`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export default function Catalogo() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
            // SEO Meta Tags
            document.title = "Ofir Velas | Velas Aromáticas Artesanais | Chá Branco, Capim Limão, Morango e Baunilha";
            
            const metaTags = [
            { name: "description", content: "Ofir: velas aromáticas artesanais premium. Descubra fragrâncias exclusivas de Chá Branco, Capim Limão, Morango e Baunilha. Tesouros em formato de velas para transformar seu ambiente." },
            { name: "keywords", content: "velas aromáticas, velas artesanais, velas decorativas, chá branco, capim limão, morango, baunilha, aromaterapia, velas premium, velas São Paulo, Ofir velas, home decor" },
            { name: "author", content: "Ofir Velas" },
            { name: "robots", content: "index, follow" },
            { name: "language", content: "Portuguese" },
            { name: "revisit-after", content: "7 days" },
            { name: "rating", content: "general" },
            
            // Open Graph / Facebook
            { property: "og:type", content: "website" },
            { property: "og:url", content: "https://www.ofirvelas.com.br/" },
            { property: "og:title", content: "Ofir Velas | Velas Aromáticas Artesanais Premium" },
            { property: "og:description", content: "Tesouros em formato de velas. Descubra nossas fragrâncias exclusivas: Chá Branco, Capim Limão, Morango e Baunilha. Velas artesanais premium." },
            { property: "og:image", content: "https://www.ofirvelas.com.br/og-image.jpg" },
            { property: "og:locale", content: "pt_BR" },
            { property: "og:site_name", content: "Ofir Velas" },
            
            // Twitter
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:url", content: "https://www.ofirvelas.com.br/" },
            { name: "twitter:title", content: "Ofir Velas | Velas Aromáticas Artesanais Premium" },
            { name: "twitter:description", content: "Tesouros em formato de velas. Descubra nossas fragrâncias exclusivas de Chá Branco, Capim Limão, Morango e Baunilha." },
            { name: "twitter:image", content: "https://www.ofirvelas.com.br/twitter-image.jpg" },
            
            // Mobile
            { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=5.0" },
            { name: "theme-color", content: "#000000" },
            { name: "apple-mobile-web-app-capable", content: "yes" },
            { name: "apple-mobile-web-app-status-bar-style", content: "black" },
            { name: "apple-mobile-web-app-title", content: "Ofir Velas" },
            
            // Geographic
            { name: "geo.region", content: "BR-SP" },
            { name: "geo.placename", content: "São Paulo" },
            ];

            metaTags.forEach(tag => {
            let meta = document.querySelector(`meta[${tag.name ? 'name' : 'property'}="${tag.name || tag.property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                if (tag.name) meta.setAttribute('name', tag.name);
                if (tag.property) meta.setAttribute('property', tag.property);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', tag.content);
            });

            
            // Canonical URL
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', 'https://www.ofirvelas.com.br/');

            // Structured Data (JSON-LD)
            const structuredData = {
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "Ofir Velas",
            "description": "Velas aromáticas artesanais premium. Fragrâncias exclusivas de Chá Branco, Capim Limão, Morango e Baunilha.",
            "url": "https://www.ofirvelas.com.br/",
            "logo": "https://www.ofirvelas.com.br/ofir-logo-white-bg.png",
            "image": "https://www.ofirvelas.com.br/og-image.jpg",
            "priceRange": "R$35",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "São Paulo",
                "addressRegion": "SP",
                "addressCountry": "BR"
            },
            "telephone": "+55-11-99999-9999",
            "openingHours": "Mo-Su 09:00-18:00",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "reviewCount": "127"
            },
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Catálogo de Velas Aromáticas",
                "itemListElement": products.map((p) => ({
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Product",
                    "name": p.name,
                    "description": p.description,
                    "offers": {
                    "@type": "Offer",
                    "price": String(p.price),
                    "priceCurrency": "BRL",
                    "availability":
                        p.status === "disponivel"
                        ? "https://schema.org/InStock"
                        : "https://schema.org/PreOrder"
                    }
                }
                }))
            }
            };

            let script = document.querySelector('script[type="application/ld+json"]');
            if (!script) {
            script = document.createElement('script');
            (script as HTMLScriptElement).type = 'application/ld+json';
            document.head.appendChild(script);
            }
            (script as HTMLScriptElement).textContent = JSON.stringify(structuredData);
        }, 
    []);


    useEffect(() => {
    async function loadProducts() {
        const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("order", { ascending: true });

        if (error) {
        console.error(error);
        setLoading(false);
        return;
        }

        setProducts(data || []);
        setLoading(false);
    }

    loadProducts();
    }, []);

  const filteredProducts =
    activeFilter === "todos"
      ? products
      : products.filter((p) => p.status === activeFilter);

  return (
    <div className="font-serif text-gray-900" style={{ fontFamily: "'Inria Serif', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inria+Serif:wght@300;400;700&display=swap');
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-50 ">
        <div className="flex justify-between items-center py-4 px-4 md:px-12">
          {/* <div className="text-2xl font-bold tracking-wider">OFIR.</div> */}
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#" className="hover:opacity-60 transition">Início</a>
            <a href="#sobre" className="hover:opacity-60 transition">Sobre</a>
            <a href="#catalogo" className="hover:opacity-60 transition">Catálogo</a>
            <a href="https://wa.me/5511964511999?text=Ol%C3%A1%2C%20gostaria%20de%20realizar%20uma%20compra." target="_blank" className="hover:opacity-60 transition">Contato</a>
            <a href="https://youtube.com/@velasofir" target="_blank" className="hover:opacity-60 transition">Suporte</a>
          </nav>

          <button className="hidden md:flex items-center gap-2 border border-black rounded-lg px-5 py-2 hover:bg-black hover:text-white transition" onClick={() => window.open("https://wa.me/5511964511999?text=Ol%C3%A1%2C%20gostaria%20de%20realizar%20uma%20compra.", "_blank")}>
            <ShoppingBag className="w-4 h-4" onClick={()=> window.location.href="https://wa.me/5511964511999?text=Ol%C3%A1%2C%20gostaria%20de%20realizar%20uma%20compra."} />
            Comprar
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-4 p-4 bg-white border-t">
            <a href="#" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Início</a>
            <a href="#sobre" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Sobre</a>
            <a href="/catalogo" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Catálogo</a>
            <a href="#suporte" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Suporte</a>
            <button className="flex items-center justify-center gap-2 rounded-lg px-5 py-2 hover:bg-black hover:text-white transition">
              <ShoppingBag className="w-4 h-4" onClick={()=> window.location.href="https://wa.me/5511964511999?text=Ol%C3%A1%2C%20gostaria%20de%20realizar%20uma%20compra."} />
              Comprar
            </button>
          </nav>
        )}
      </header>

      {/* Catálogo */}
      <section id="catalogo" className="bg-white py-16 px-4 md:px-16 mt-20">
        <div className="max-w-6xl mx-auto">

          {/* CABEÇALHO DA SEÇÃO */}
          <div className="mb-10 md:mb-14 text-center">
            <h2 className="text-4xl md:text-6xl font-semibold mb-4">Catálogo</h2>
            <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto">
              Cada vela é feita à mão, em pequenos lotes. Algumas estão prontas
              para envio, outras você encomenda sob medida.
            </p>
          </div>

          {/* FILTROS */}
          <div className="flex justify-center gap-2 md:gap-3 mb-12 flex-wrap">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-5 py-2 rounded-full border text-sm md:text-base transition ${
                  activeFilter === filter.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300 hover:border-black"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

        {/* GRID DE PRODUTOS */}
        {loading ? (
            <p className="text-center text-gray-500 py-16">
                Carregando produtos...
            </p>
        ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
                {filteredProducts.map((product) => (
                <div key={product.id} className="flex flex-col group">

                    {/* IMAGEM */}
                    <div className="relative w-full aspect-square bg-gray-50 rounded-lg mb-5 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                        <img
                        src={product.image}
                        alt={product.name}
                        className="w-[75%] h-[75%] object-contain transition duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <span className="text-xs text-gray-400 tracking-widest uppercase">
                        Foto em breve
                        </span>
                    )}

                    {/* STATUS BADGE */}
                    <span
                        className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] tracking-wide uppercase px-3 py-1 rounded-full ${
                        product.status === "disponivel"
                            ? "bg-black text-white"
                            : "bg-white text-black border border-black"
                        }`}
                    >
                        {product.status === "disponivel" ? (
                        <Check className="w-3 h-3" />
                        ) : (
                        <Clock className="w-3 h-3" />
                        )}
                        {STATUS_LABEL[product.status]}
                    </span>
                    </div>

                    {/* COLEÇÃO (TAG) */}
                    <span className="text-xs tracking-widest uppercase text-gray-500 mb-2">
                    {product.collection}
                    </span>

                    {/* NOME */}
                    <h3 className="text-2xl font-semibold mb-2">{product.name}</h3>

                    {/* DESCRIÇÃO */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {product.description}
                    </p>

                    {/* DETALHES */}
                    <div className="text-xs text-gray-500 mb-4 space-y-0.5">
                    <p>{product.tamanho}</p>
                    <p>{product.queima}</p>
                    <p>{product.materia_prima}</p>
                    </div>

                    {/* PREÇO */}
                    <p className="text-lg font-medium mb-4">
                    R${product.price}
                    </p>

                    {/* BOTÃO */}
                    <button
                    onClick={() => window.open(whatsappLink(product), "_blank")}
                    className="mt-auto border border-black px-6 py-3 rounded-lg hover:bg-black hover:text-white transition duration-300"
                    >
                    {product.status === "disponivel" ? "Comprar" : "Encomendar"}
                    </button>

                </div>
                ))}
            </div>
        ) : (
            <p className="text-center text-gray-500 py-16">
                Nenhum produto encontrado.
            </p>
        )}
        
        </div>
      </section>

      {/* Suporte */}
      <section id="suporte" className="py-12 px-4  text-center border-t bg-black text-white">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-base md:text-lg">
          <span className="font-bold">Suporte</span>
          <span className="hidden md:inline">|</span>
          <span>Tire suas dúvidas no nosso canal do</span>
          <a href="https://www.youtube.com/@velasofir" target="_blank" className="underline flex items-center gap-1 hover:opacity-60 transition">
            <Youtube className="w-5 h-5" />
            Youtube
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 md:px-16 border-t">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h2 className="text-2xl font-bold mb-4">OFIR.</h2>
            <div className="flex flex-col gap-2">
              <a href="#" className="hover:opacity-60 transition">Início</a>
              <a href="#sobre" className="hover:opacity-60 transition">Sobre</a>
              <a href="#catalogo" className="hover:opacity-60 transition">Catálogo</a>
              <a href="https://wa.me/5511964511999?text=${encodeURIComponent('Olá, gostaria de saber mais sobre os produtos.')}" className="hover:opacity-60 transition">Contato</a>
              <a href="https://youtube.com/@velasofir" className="hover:opacity-60 transition">Suporte</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Redes sociais</h3>
            <div className="flex flex-col gap-2">
              <a href="https://www.instagram.com/velasofir" className="flex items-center gap-2 hover:opacity-60 transition">
                <Instagram className="w-4 h-4" />
                Instagram
              </a>
              <a href="https://www.youtube.com/@velasofir" className="flex items-center gap-2 hover:opacity-60 transition">
                <Youtube className="w-4 h-4" />
                Youtube
              </a>
              <a href={`https://wa.me/5511964511999?text=${encodeURIComponent("Olá, gostaria de saber mais sobre os produtos.")}`} className="flex items-center gap-2 hover:opacity-60 transition">
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>
              <a href="https://www.tiktok.com/@velasofir" className="flex items-center gap-2 hover:opacity-60 transition">
                <Sparkles className="w-4 h-4" />
                TikTok
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-center gap-2 border-2 border-black rounded-lg px-5 py-2 hover:bg-black hover:text-white transition" onClick={() => window.location.href = `https://wa.me/5511964511999?text=${encodeURIComponent("Olá, gostaria de realizar uma compra.")}`}>
              <ShoppingBag className="w-4 h-4" />
              Comprar
            </button>
            <button className="flex items-center justify-center gap-2 border-2 border-black rounded-lg px-5 py-2 hover:bg-black hover:text-white transition" onClick={() => window.location.href = `https://wa.me/5511964511999?text=${encodeURIComponent("Olá, gostaria de tirar uma dúvida sobre os produtos.")}`}>
              <Mail className="w-4 h-4" />
              Dúvidas
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}