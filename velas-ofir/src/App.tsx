import { useEffect, useRef, useState } from "react";
import {  Sparkles,  ShoppingBag, Menu, X, Mail, Phone, Youtube, Instagram } from "lucide-react";
import { Typewriter } from "./components/Typing/typing";
import CascaBaunilha from "./assets/casca-baunilha.png";
import Maracuja from "./assets/maracuja.png";
import CestoMorango from "./assets/cesto-morango.png";
import VideoBackgroundOfir from "./assets/video-background-ofir.mp4";
import FirstCollection from "./assets/first-collection.png";
import SnowToy from "./assets/snow-toy.png";
import Dessert from "./assets/dessert.png";

export default function App() {
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
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Vela Capim Limão",
              "description": "Para Despertar e Focar — Escolha aromas que estimulem o foco e revigorem a mente.",
              "offers": {
                "@type": "Offer",
                "price": "35",
                "priceCurrency": "BRL"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Vela Chá Branco",
              "description": "Para Tranquilidade — Notas leves e suaves para acalmar os pensamentos.",
              "offers": {
                "@type": "Offer",
                "price": "35",
                "priceCurrency": "BRL"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Vela Morango",
              "description": "Para Alegria — Aroma doce e vibrante que inspira felicidade.",
              "offers": {
                "@type": "Offer",
                "price": "35",
                "priceCurrency": "BRL"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Vela Baunilha",
              "description": "Para Conforto — Aroma quente e envolvente, ideal para relaxar.",
              "offers": {
                "@type": "Offer",
                "price": "35",
                "priceCurrency": "BRL"
              }
            }
          }
        ]
      }
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      (script as HTMLScriptElement).type = 'application/ld+json';
      document.head.appendChild(script);
    }
    (script as HTMLScriptElement).textContent = JSON.stringify(structuredData);
  }, []);



  
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [,setTyped] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const sectionRef = useRef(null);


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);

          // tempo do typing (mais lento)
          setTimeout(() => setTyped(true), 3500);

          // conteúdo aparece depois
          setTimeout(() => setShowContent(true), 3500);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);
    
  // const products = [
  //   {
  //     name: "Pinheiro de Inverno - Baunilha",
  //     desc: "A mistura perfeita entre o frescor do pinheiro e o aconchego da baunilha. Aroma suave e natalino para aquecer o ambiente.",
  //     queima: "Queima: 25h",
  //     tamanho: "Tamanho: 150g",
  //     materiaPrima: "Cera de coco",
  //     icon: Pinheiro ? <img src={Pinheiro} alt="Pinheiro de Inverno" className="w-full object-contain" /> : <Wind className="w-5 h-5" />,
  //     color: "",
  //     price: 55,
  //     link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma capim limão.`)}`,
  //   },
  //   {
  //     name: "Pinheiro de Inverno - Bamboo com Alecrim",
  //     desc: "Refrescante e revigorante. Bamboo e alecrim trazem leveza e foco, enquanto o toque de pinheiro entrega o clima do Natal.",
  //     queima: "Queima: 25h",
  //     tamanho: "Tamanho: 150g",
  //     materiaPrima: "Cera de coco",
  //     icon: Pinheiro ? <img src={Pinheiro} alt="Chá Branco" className="w-sm-full object-contain" /> : <Leaf className="w-5 h-5" />,
  //     color: "",
  //     price: 55,
  //     link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma chá branco.`)}`,
  //   },
  //   {
  //     name: "2 Flocos de Neve - Baunilha",
  //     desc: "Doce, delicado e acolhedor. A essência ideal para criar uma atmosfera tranquila e festiva nas noites de Natal.",
  //     queima: "Queima: 25h",
  //     tamanho: "Tamanho: 50g",
  //     materiaPrima: "Cera de coco",
  //     icon: Flocos ? <img src={Flocos} alt="Flocos de Neve" className="w-full object-contain" /> : <Heart className="w-5 h-5" />,
  //     color: "",
  //     price: 25,
  //     link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma morango.`)}`,
  //   },
  //   {
  //     name: "2 Flocos de Neve - Bamboo com Alecrim",
  //     desc: "Leve, puro e renovador. A combinação perfeita para deixar o ambiente mais fresco e iluminado nesta temporada natalina.",
  //     queima: "Queima: 25h",
  //     tamanho: "Tamanho: 50g",
  //     materiaPrima: "Cera de coco",
  //     icon: Flocos ? <img src={Flocos} alt="Baunilha" className="w-sm-full object-contain" /> : <Sparkles className="w-5 h-5" />,
  //     color: "",
  //     price: 25,
  //     link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma baunilha.`)}`,
  //   },
  // ];
  


  // const base_products = [
  //   {
  //     name: "Capim Limão",
  //     desc: "Para Despertar e Focar — Escolha aromas que estimulem o foco e revigorem a mente.",
  //     queima: "Queima: 25h",
  //     tamanho: "Tamanho: 110g",
  //     materiaPrima: "Cera de coco",
  //     icon: CapimLimao ? <img src={CapimLimao} alt="Capim Limão" className="w-full object-contain" /> : <Wind className="w-5 h-5" />,
  //     color: "",
  //     price: 35,
  //     link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma capim limão.`)}`,
  //   },
  //   {
  //     name: "Chá Branco",
  //     desc: "Para Tranquilidade — Notas leves e suaves para acalmar os pensamentos.",
  //     queima: "Queima: 25h",
  //     tamanho: "Tamanho: 110g",
  //     materiaPrima: "Cera de coco",
  //     icon: ChaBranco ? <img src={ChaBranco} alt="Chá Branco" className="w-sm-full object-contain" /> : <Leaf className="w-5 h-5" />,
  //     color: "",
  //     price: 35,
  //     link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma chá branco.`)}`,
  //   },
  //   {
  //     name: "Morango",
  //     desc: "Para Alegria — Aroma doce e vibrante que inspira felicidade.",
  //     queima: "Queima: 25h",
  //     tamanho: "Tamanho: 110g",
  //     materiaPrima: "Cera de coco",
  //     icon: Morango ? <img src={Morango} alt="Morango" className="w-full object-contain" /> : <Heart className="w-5 h-5" />,
  //     color: "",
  //     price: 35,
  //     link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma morango.`)}`,
  //   },
  //   {
  //     name: "Baunilha",
  //     desc: "Para Conforto — Aroma quente e envolvente, ideal para relaxar.",
  //     queima: "Queima: 25h",
  //     tamanho: "Tamanho: 110g",
  //     materiaPrima: "Cera de coco",
  //     icon: Baunilha ? <img src={Baunilha} alt="Baunilha" className="w-sm-full object-contain" /> : <Sparkles className="w-5 h-5" />,
  //     color: "",
  //     price: 35,
  //     link: `https://wa.me/5511964511999?text=${encodeURIComponent(`Olá, gostaria de realizar uma compra de ${productLength} velas com aroma baunilha.`)}`,
  //   },
  // ];
  
  const collections = [
    {
      name: "Dessert Collection",
      desc: "A doçura se revela de forma sofisticada, criando uma atmosfera acolhedora, marcante e irresistivelmente confortável.",
      image: Dessert,
      active: true,
      highlight: true,
      price: "A partir de R$45",
      badge: "Lançamento"
    },
    {
      name: "First Collection",
      desc: "Uma expressão pura da essência Ofir, com formas, aromas e intenções que deram origem a uma identidade construída com sensibilidade e propósito.",
      image: FirstCollection,
      active: false
    },
    {
      name: "White Christmas Collection",
      desc: "Notas suaves e envolventes que evocam a leveza do inverno e a elegância dos momentos mais íntimos.",
      image: SnowToy,
      active: false
    }
  ];

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
            <a href="#catalogo" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Catálogo</a>
            <a href="#suporte" className="hover:opacity-60 transition" onClick={() => setMenuOpen(false)}>Suporte</a>
            <button className="flex items-center justify-center gap-2 rounded-lg px-5 py-2 hover:bg-black hover:text-white transition">
              <ShoppingBag className="w-4 h-4" onClick={()=> window.location.href="https://wa.me/5511964511999?text=Ol%C3%A1%2C%20gostaria%20de%20realizar%20uma%20compra."} />
              Comprar
            </button>
          </nav>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Hero */}
      <section className="relative w-full min-h-screen bg-white flex flex-col justify-center py-6 pl-12 md:flex-row md:items-center md:py-12">
        {/* TEXTO */}
        <div className="z-10 md:w-1/2 ml-8">

          <h1 className="text-5xl md:text-8xl font-serif text-black mb-4 md:mb-6 opacity-0 animate-fade-up">
            OFIR.
          </h1>

          <p className="text-sm font-bold mt-4 opacity-80 animate-fade-up">
            Tesouros em formato de velas
          </p>

          <p className="text-lg md:text-2xl mb-6 md:mb-8 max-w-sm md:max-w-lg opacity-0 animate-delay-1">
            <span className="font-semibold">Nova Dessert Collection</span> disponível{" "}
            <span className="font-semibold">
              <Typewriter text="Hoje" />
            </span>
          </p>


          <a href="#catalogo">
            <button className="bg-black text-white px-6 py-3 md:px-8 rounded-md opacity-0 animate-delay-2 hover:opacity-90 transition">
              Saiba mais
            </button>
          </a>


        </div>

        {/* IMAGENS */}
        <div className="pointer-events-none absolute inset-0 md:relative md:w-[30%] md:ml-auto z-10">

          <div className="absolute bottom-0 right-0 w-40 md:w-[22vw] animate-float">
            <img src={Maracuja} className="w-full h-auto object-contain drop-shadow-xl"/>
          </div>
          
          <div className="absolute top-0 right-0 w-32 md:w-[20vw] animate-float [animation-delay:1s]">
            <img src={CascaBaunilha} className="w-full h-auto object-contain drop-shadow-xl"/>
          </div>

          <div className="absolute top-0 right-0 w-40 md:w-[24vw] animate-float [animation-delay:2s]">
            <img src={CestoMorango} className="w-full h-auto object-contain drop-shadow-xl"/>
          </div>

        </div>

      </section>

      <section ref={sectionRef} className="bg-white relative">

        {/* FAIXA PRETA FULL WIDTH */}
        <div
          className={`
            w-full bg-black text-white flex justify-center items-center
            transition-all duration-[1200ms] ease-in-out
            ${visible ? "h-40 md:h-52" : "h-0 overflow-hidden"}
          `}
        >
          <h2 className="text-4xl md:text-6xl font-semibold tracking-wide">
            {visible && <Typewriter text="LANÇAMENTO" />}
          </h2>
        </div>

        {/* CONTEÚDO */}
        <div
          className={`
            max-w-6xl mx-auto py-20 px-4 md:px-16
            flex flex-col md:flex-row items-center gap-10
            transition-all duration-[1200ms] ease-out
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
          `}
        >

          {/* IMAGEM */}
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src={Dessert}
              alt="Dessert Collection"
              className="w-[90%] md:w-[95%] object-contain scale-105 transition duration-[1500ms]"
            />
          </div>

          {/* TEXTO */}
          <div className="w-full md:w-1/2 max-w-md">

            <h2 className="text-4xl md:text-6xl font-semibold mb-4">
              Dessert Collection
            </h2>

            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
              A doçura se revela de forma sofisticada, criando uma atmosfera acolhedora,
              marcante e irresistivelmente confortável.
            </p>

            <p className="text-lg md:text-xl font-medium mb-4">
              Peças a partir de R$45
            </p>

            <p className="text-sm text-gray-500 mb-8">
              Disponível por tempo limitado
            </p>

            <button
              onClick={() => {
                const url = `https://wa.me/5511964511999?text=${encodeURIComponent(
                  "Olá! Quero garantir uma vela da Dessert Collection."
                )}`;
                window.open(url, "_blank");
              }}
              className="bg-black text-white px-8 py-3 rounded-lg hover:opacity-90 transition"
            >
              Quero garantir a minha
            </button>

          </div>

        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="relative bg-black text-white py-24 px-4 md:px-16 overflow-hidden z-0">

        {/* VIDEO BACKGROUND */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src={VideoBackgroundOfir} type="video/mp4" />
        </video>

        {/* OVERLAY ESCURO */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* CONTEÚDO */}
        <div className="relative max-w-6xl mx-auto flex flex-col items-center text-center">

          {/* TÍTULO CENTRAL */}
          <h2 className="text-3xl md:text-5xl font-semibold mb-10">
            A primeira faísca
            {/* <span className="font-bold">
              <Typewriter text="faísca" />
            </span> */}
          </h2>

          {/* TEXTO */}
          <div className="max-w-3xl space-y-6 text-sm md:text-base leading-relaxed text-gray-100">
            <p>
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

          {/* BOTÃO */}
          <button
            className="mt-10 bg-white text-black px-8 py-3 rounded-lg hover:opacity-90 transition"
            onClick={() => window.open("https://www.instagram.com/velasofir", "_blank")}
          >
            Saiba mais
          </button>

        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="bg-white py-10 px-4 md:px-16 overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-16">

          {collections.map((collection, index) => (
            <div
              key={collection.name}
              className={`relative flex flex-col md:flex-row items-center ${
                index % 2 !== 0 ? "md:flex-row-reverse" : ""
              } ${collection.highlight ? "mb-20" : ""}`}
            >

              {/* IMAGEM */}
              <div className="w-full md:w-1/2 relative flex justify-center">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className={`w-[85%] md:w-[95%] object-contain transition duration-700 ${
                    collection.highlight ? "scale-105" : ""
                  }`}
                />
              </div>

              {/* TEXTO */}
              <div className="w-full md:w-1/2 max-w-md z-10 mt-8 md:mt-0
                              opacity-0 translate-y-6 animate-fade-up">

                {/* BADGE */}
                {collection.badge && (
                  <span className="inline-block mb-3 text-xs tracking-widest uppercase text-gray-500">
                    {collection.badge}
                  </span>
                )}

                {/* TITULO */}
                <h3 className={`font-semibold mb-4 ${
                  collection.highlight ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"
                }`}>
                  {collection.name}
                </h3>

                {/* DESCRIÇÃO */}
                <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
                  {collection.desc}
                </p>

                {/* PREÇO (premium, sem parecer loja) */}
                {collection.price && (
                  <p className="text-lg md:text-xl font-medium mb-4">
                    {collection.price}
                  </p>
                )}

                {/* GATILHO */}
                {collection.highlight && (
                  <p className="text-sm text-gray-500 mb-6">
                    Disponível por tempo limitado
                  </p>
                )}

                {/* BOTÃO */}
                <button
                  onClick={() => {
                    const phone = "5511964511999";
                    const msg = collection.highlight
                      ? `Olá! Quero garantir uma vela da Dessert Collection.`
                      : collection.active
                      ? `Olá! Tenho interesse na coleção ${collection.name}.`
                      : `Olá! Gostaria de encomendar itens da coleção ${collection.name}.`;

                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                    window.open(url, "_blank");
                  }}
                  className="border border-black px-6 py-3 rounded-lg 
                            hover:bg-black hover:text-white 
                            transition duration-300"
                >
                  {collection.highlight
                    ? "Quero garantir a minha"
                    : collection.active
                    ? "Comprar"
                    : "Encomendar"}
                </button>

              </div>
            </div>
          ))}

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