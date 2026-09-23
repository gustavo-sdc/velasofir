import { useEffect, useRef, useState } from "react";
import { Sparkles, ShoppingBag, Menu, X, Mail, Phone, Youtube, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WHATSAPP = "https://wa.me/5511964511999";
const whatsappLink = (texto: string) => `${WHATSAPP}?text=${encodeURIComponent(texto)}`;

export default function Sorteador() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const numbersSort = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const [exibido, setExibido] = useState<number | null>(null);
  const [sorteando, setSorteando] = useState(false);
  const [rodada, setRodada] = useState(0); // força a animação de "pop" a rodar a cada sorteio
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa o timer se o componente for desmontado no meio do sorteio
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const numeroAleatorio = () =>
    numbersSort[Math.floor(Math.random() * numbersSort.length)];

  const sortear = () => {
    if (sorteando) return;
    setSorteando(true);

    const final = numeroAleatorio();
    const totalTrocas = 18;
    let troca = 0;

    // Os números trocam cada vez mais devagar, até parar no resultado
    const girar = () => {
      troca++;
      if (troca >= totalTrocas) {
        setExibido(final);
        setRodada((r) => r + 1);
        setSorteando(false);
        return;
      }
      setExibido(numeroAleatorio());
      timerRef.current = setTimeout(girar, 60 + troca * 7);
    };

    girar();
  };

  const comprar = () =>
    window.open(whatsappLink("Olá, gostaria de realizar uma compra."), "_blank");

  return (
    <div className="font-serif text-gray-900" style={{ fontFamily: "'Inria Serif', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inria+Serif:wght@300;400;700&display=swap');

        @keyframes sorteador-pop {
          0%   { transform: scale(0.6); opacity: 0.3; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sorteador-giro {
          to { transform: rotate(360deg); }
        }
        .sorteador-pop  { animation: sorteador-pop 0.5s ease-out both; }
        .sorteador-anel { animation: sorteador-giro 1.2s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .sorteador-pop, .sorteador-anel { animation: none; }
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-50">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center py-4 px-4 md:px-12">
          {/* Esquerda: navegação (desktop) */}
          <div className="justify-self-start">
            <nav className="hidden md:flex gap-6 text-sm">
              <a
                href="/"
                className="hover:opacity-60 transition"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
              >
                Início
              </a>
              <a
                href="/sobre"
                className="hover:opacity-60 transition"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/sobre");
                }}
              >
                Sobre
              </a>
              <a
                href="/catalogo"
                className="hover:opacity-60 transition"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/catalogo");
                }}
              >
                Catálogo
              </a>
              <a
                href={whatsappLink("Olá, gostaria de realizar uma compra.")}
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-60 transition"
              >
                Contato
              </a>
              <a
                href="https://youtube.com/@velasofir"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-60 transition"
              >
                Suporte
              </a>
            </nav>
          </div>

          {/* Centro: logo */}
          <a
            href="/"
            className="justify-self-center text-2xl font-bold tracking-wider"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            OFIR.
            {/* Se tiver uma imagem de logo, troque o texto acima por:
                <img src="/logo.png" alt="Velas Ofir" className="h-8 w-auto" /> */}
          </a>

          {/* Direita: botão comprar (desktop) / menu (mobile) */}
          <div className="justify-self-end">
            <button
              className="hidden md:flex items-center gap-2 border border-black rounded-lg px-5 py-2 hover:bg-black hover:text-white transition"
              onClick={comprar}
            >
              <ShoppingBag className="w-4 h-4" />
              Comprar
            </button>

            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-4 p-4 bg-white border-t">
            <a
              href="/"
              className="hover:opacity-60 transition"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
                setMenuOpen(false);
              }}
            >
              Início
            </a>
            <a
              href="/sobre"
              className="hover:opacity-60 transition"
              onClick={(e) => {
                e.preventDefault();
                navigate("/sobre");
                setMenuOpen(false);
              }}
            >
              Sobre
            </a>
            <a
              href="/catalogo"
              className="hover:opacity-60 transition"
              onClick={(e) => {
                e.preventDefault();
                navigate("/catalogo");
                setMenuOpen(false);
              }}
            >
              Catálogo
            </a>
            <a href="#suporte" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>
              Suporte
            </a>
            <button
              className="flex items-center justify-center gap-2 rounded-lg px-5 py-2 hover:bg-black hover:text-white transition"
              onClick={comprar}
            >
              <ShoppingBag className="w-4 h-4" />
              Comprar
            </button>
          </nav>
        )}
      </header>

      {/* Sorteador */}
      <section
        id="sorteador"
        className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 md:px-16"
      >
        <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center gap-6">
          <h2 className="text-3xl md:text-4xl font-bold">Sorteador</h2>
          <p className="text-lg md:text-xl">
            Clique no botão abaixo para sortear um número de 1 a 14.
          </p>

          {/* Visor do número */}
          <div className="relative w-44 h-44 md:w-56 md:h-56 flex items-center justify-center my-4">
            <div
              className={`absolute inset-0 rounded-full border-2 ${
                sorteando ? "border-dashed border-black sorteador-anel" : "border-black"
              }`}
            />
            <span
              key={rodada}
              className={`text-6xl md:text-7xl font-bold tabular-nums ${
                !sorteando && exibido !== null ? "sorteador-pop" : ""
              } ${sorteando ? "opacity-70" : ""}`}
            >
              {exibido ?? "?"}
            </span>
          </div>

          {/* Leitores de tela */}
          <p className="sr-only" aria-live="polite">
            {!sorteando && exibido !== null ? `Número sorteado: ${exibido}` : ""}
          </p>

          <button
            onClick={sortear}
            disabled={sorteando}
            className="flex items-center gap-2 border border-black rounded-lg px-6 py-2 hover:bg-black hover:text-white transition disabled:opacity-50 disabled:pointer-events-none"
          >
            <Sparkles className="w-4 h-4" />
            {sorteando ? "Sorteando..." : exibido === null ? "Sortear" : "Sortear novamente"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 md:px-16 border-t">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h2 className="text-2xl font-bold mb-4">OFIR.</h2>
            <div className="flex flex-col gap-2">
              <a href="/" className="hover:opacity-60 transition">Início</a>
              <a href="/sobre" className="hover:opacity-60 transition">Sobre</a>
              <a href="/catalogo" className="hover:opacity-60 transition">Catálogo</a>
              <a
                href={whatsappLink("Olá, gostaria de saber mais sobre os produtos.")}
                className="hover:opacity-60 transition"
              >
                Contato
              </a>
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
              <a
                href={whatsappLink("Olá, gostaria de saber mais sobre os produtos.")}
                className="flex items-center gap-2 hover:opacity-60 transition"
              >
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
            <button
              className="flex items-center justify-center gap-2 border-2 border-black rounded-lg px-5 py-2 hover:bg-black hover:text-white transition"
              onClick={() => (window.location.href = whatsappLink("Olá, gostaria de realizar uma compra."))}
            >
              <ShoppingBag className="w-4 h-4" />
              Comprar
            </button>
            <button
              className="flex items-center justify-center gap-2 border-2 border-black rounded-lg px-5 py-2 hover:bg-black hover:text-white transition"
              onClick={() =>
                (window.location.href = whatsappLink("Olá, gostaria de tirar uma dúvida sobre os produtos."))
              }
            >
              <Mail className="w-4 h-4" />
              Dúvidas
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}