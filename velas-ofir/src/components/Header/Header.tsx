import { useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OfirLogo from "../../assets/ofir-logo-white-bg.png";

export default function Header(){
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-300 font-poppins">
            <div className="flex justify-between items-center py-4 px-4 md:px-12 gap-2">
                {/* Desktop Nav */}
                <img src={OfirLogo} alt="Logo" className="h-5 w-auto cursor-pointer" onClick={() => navigate("/")} />

                <nav className="hidden md:flex gap-6 text-sm justify-evenly items-center">
                    <a href="#" className="hover:opacity-60 transition">Inicio</a>
                    <a href="#sobre" className="hover:opacity-60 transition">Sobre</a>
                    <a href="/catalogo" className="hover:opacity-60 transition" onClick={(e) => {
                        e.preventDefault();
                        navigate("/catalogo");
                    }}>Produtos</a>
                    <a href="" className="hover:opacity-60 transition">Eventos</a>
                    <a href="https://wa.me/5511964511999?text=Ol%C3%A1%2C%20gostaria%20de%20realizar%20uma%20compra." target="_blank" className="hover:opacity-60 transition">Contato</a>
                    <a href="https://youtube.com/@velasofir" target="_blank" className="hover:opacity-60 transition">Suporte</a>
                </nav>

                <div>
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


            </div>

            {/* Mobile Nav */}
            {menuOpen && (
                <nav className="md:hidden flex flex-col gap-4 p-4 bg-white border-t">
                <a href="#" className="hover:opacity-60 transition">Início</a>
                <a href="#sobre" className="hover:opacity-60 transition" >Sobre</a>
                <a href="/catalogo" className="hover:opacity-60 transition" onClick={(e) => {
                    e.preventDefault();
                    navigate("/catalogo");
                    setMenuOpen(false);
                }}>Catálogo</a>
                <a href="#suporte" className="hover:opacity-60 transition">Suporte</a>
                <button className="flex items-center justify-center gap-2 rounded-lg px-5 py-2 hover:bg-black hover:text-white transition">
                    <ShoppingBag className="w-4 h-4" onClick={()=> window.location.href="https://wa.me/5511964511999?text=Ol%C3%A1%2C%20gostaria%20de%20realizar%20uma%20compra."} />
                    Comprar
                </button>
                </nav>
            )}
            </header>
    )
}