import { useState } from "react";
import { Leaf, Sparkles, Heart, Wind, ShoppingBag, Menu, X, MapPin, Mail, Phone, Youtube, Instagram, Paperclip, ScrollText } from "lucide-react";
import Baunilha from "./assets/baunilha-oficial.png";
import CapimLimao from "./assets/capim-limao-oficial.png";
import ChaBranco from "./assets/cha-branco-oficial.png";
import Morango from "./assets/morango-oficial.png";
import Logo from "./assets/ofir-logo-white-bg.png";
import Lari from "./assets/pequena-lari.png";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [productLength, setProductLength] = useState(0);
  
  const products = [
    {
      name: "Capim Limão",
      desc: "Para Despertar e Focar — Escolha aromas que estimulem o foco e revigorem a mente.",
      queima: "Queima: 25h",
      tamanho: "Tamanho: 110g",
      materiaPrima: "Cera de coco",
      icon: CapimLimao ? <img src={CapimLimao} alt="Capim Limão" className="w-full object-contain" /> : <Wind className="w-5 h-5" />,
      color: "",
      link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma capim limão.`)}`,
    },
    {
      name: "Chá Branco",
      desc: "Para Tranquilidade — Notas leves e suaves para acalmar os pensamentos.",
      queima: "Queima: 25h",
      tamanho: "Tamanho: 110g",
      materiaPrima: "Cera de coco",
      icon: ChaBranco ? <img src={ChaBranco} alt="Chá Branco" className="w-sm-full object-contain" /> : <Leaf className="w-5 h-5" />,
      color: "",
      link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma chá branco.`)}`,
    },
    {
      name: "Morango",
      desc: "Para Alegria — Aroma doce e vibrante que inspira felicidade.",
      queima: "Queima: 25h",
      tamanho: "Tamanho: 110g",
      materiaPrima: "Cera de coco",
      icon: Morango ? <img src={Morango} alt="Morango" className="w-full object-contain" /> : <Heart className="w-5 h-5" />,
      color: "",
      link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma morango.`)}`,
    },
    {
      name: "Baunilha",
      desc: "Para Conforto — Aroma quente e envolvente, ideal para relaxar.",
      queima: "Queima: 25h",
      tamanho: "Tamanho: 110g",
      materiaPrima: "Cera de coco",
      icon: Baunilha ? <img src={Baunilha} alt="Baunilha" className="w-sm-full object-contain" /> : <Sparkles className="w-5 h-5" />,
      color: "",
      link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma baunilha.`)}`,
    },
  ];

  const [selected, setSelected] = useState(products[0]);

  return (
    <div className="font-serif text-gray-900" style={{ fontFamily: "'Inria Serif', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inria+Serif:wght@300;400;700&display=swap');
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center py-4 px-4 md:px-12">
          <div className="text-2xl font-bold tracking-wider">OFIR.</div>
          
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
            <a href="#catalogo" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Catálogo</a>
            <a href="#contato" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Contato</a>
            <a href="#suporte" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Suporte</a>
            <button className="flex items-center justify-center gap-2 border border-black rounded-lg px-5 py-2 hover:bg-black hover:text-white transition">
              <ShoppingBag className="w-4 h-4" onClick={()=> window.location.href="https://wa.me/5511964511999?text=Ol%C3%A1%2C%20gostaria%20de%20realizar%20uma%20compra."} />
              Comprar
            </button>
          </nav>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Hero */}
      <section className="flex flex-col items-center text-center py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="text-6xl md:text-8xl font-bold tracking-wider mb-4">OFIR.</div>
        <p className="text-xl md:text-2xl mb-8 max-w-md">
          <span className="font-bold">Tesouros</span> em formato de <span className="font-bold">velas</span>
        </p>
        <a href="#catalogo">
          <button className="bg-black text-white px-8 py-3 rounded-lg hover:opacity-90 transition">
            Saiba mais
          </button>
        </a>
      </section>

      {/* Produtos Preview */}
      <section className="py-12 px-4 bg-white">
        <div className="flex justify-center align-center -gap-4 overflow-x-auto pb-4">
          {products.map((product, idx) => (
            <div key={idx} className={`w-64 md:w-64 ${product.color} flex items-center justify-center`}>
              {product.icon}
            </div>
          ))}
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="bg-black text-white py-16 px-4 md:px-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Sobre</h2>
            <div className="space-y-4 text-sm md:text-base leading-relaxed">
              <p>
                <strong>A primeira faísca</strong><br />
                Nasci em São Paulo, cercada por <strong>movimento</strong> e <strong>possibilidades</strong> e desde cedo, a curiosidade foi o que me guiou.
              </p>
              <p>
                Sempre gostei de criar, de entender como as coisas funcionam e de conquistar o que eu imaginava. 
                Durante a pandemia, aos 18 anos, transformei meu tempo livre em um pequeno grande passo: criei minha primeira loja online de miçangas, onde descobri o prazer de dar forma às ideias.
              </p>
              <p>
                Aos 18, iniciei a faculdade de medicina, atraída pela precisão e pela busca constante por aperfeiçoamento. 
                Entre a arte e a ciência, encontrei meu <strong>equilíbrio</strong> e é dessa união que nasce a essência de Ofir.
              </p>
            </div>
            <button className="mt-8 bg-white text-black px-8 py-3 rounded-lg hover:opacity-90 transition" onClick={() => window.open("https://www.instagram.com/velasofir", "_blank")}>
              Saiba mais
            </button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img src={Lari} alt="Lari" className="w-48 md:w-60" />
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="py-16 px-4 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Catálogo</h2>
          
          {/* Product Selector */}
          <div className="flex flex-wrap gap-3 mb-10">
            {products.map((p) => (
              <button
                key={p.name}
                onClick={() => setSelected(p)}
                className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg text-sm md:text-base transition ${
                  selected.name === p.name
                    ? "bg-black text-white border-black"
                    : "border-gray-300 hover:border-black"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Product Display */}
          <div className="bg-gray-50 rounded-2xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 flex justify-center">
                <div className={`w-64 h-64 md:w-80 md:h-80 ${selected.color} rounded-2xl shadow-lg flex items-center justify-center`}>
                  <div className="text-8xl">
                    {selected.icon}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h3 className="text-3xl font-bold mb-2">{selected.name}</h3>
                <p className="text-base md:text-lg mb-6 leading-relaxed">{selected.desc}</p>
                <div className="space-y-1 mb-6 text-sm md:text-base">
                  <p><strong>{selected.queima}</strong></p>
                  <p><strong>{selected.tamanho}</strong></p>
                  <p><strong>Matéria-prima:</strong> {selected.materiaPrima}</p>
                </div>
                  {/* Input de quantidade */}
                  <div className="flex items-center bg-black text-white rounded-lg px-3 py-3 mb-2 justify-between w-full max-w-xs">
                    <label htmlFor="quantidade" className="text-sm mr-2">Qtd:</label>

                    <div className="flex items-center gap-2">
                      {/* Botão de diminuir */}
                      <button
                        type="button"
                        onClick={() => setProductLength(Math.max(1, productLength - 1))}
                        className="bg-white text-black w-6 h-6 rounded-md flex items-center justify-center font-bold hover:opacity-80 transition"
                      >
                        –
                      </button>

                      {/* Input numérico */}
                      <input
                        type="number"
                        name="quantidade"
                        id="quantidade"
                        min="1"
                        value={productLength}
                        onChange={(e) => setProductLength(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-10 text-center bg-transparent text-white outline-none"
                      />

                      {/* Botão de aumentar */}
                      <button
                        type="button"
                        onClick={() => setProductLength(productLength + 1)}
                        className="bg-white text-black w-6 h-6 rounded-md flex items-center justify-center font-bold hover:opacity-80 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>


                  {/* Botão de compra */}
                  <button
                    onClick={() => {
                      const phone = "5511964511999";
                      const msg = `Olá! Tenho interesse em ${productLength} vela(s) ${selected.name}.`;
                      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                      window.open(url, "_blank");
                    }}
                    className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3 rounded-lg hover:opacity-90 transition w-full max-w-xs"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Fazer pedido
                  </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato
      <section id="contato" className="bg-black text-white py-16 px-4 md:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Contato</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col gap-4 w-full md:w-1/2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-11 rounded-lg text-black bg-white"
                />
              </div>
              <div className="relative">
                <ScrollText className="absolute left-3 top-3 w-5 h-5 text-gray-500 " />
                <input
                  type="text"
                  placeholder="Assunto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 rounded-lg text-black bg-white pl-11"
                />
              </div>
              <button 
                onClick={handleContact}
                className="bg-white text-black py-3 rounded-lg hover:opacity-90 transition font-semibold"
              >
                Entrar em contato
              </button>
            </div>

          </div>
        </div>
      </section> */}

      {/* Suporte */}
      <section id="suporte" className="py-12 px-4 text-center border-t bg-black text-white">
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