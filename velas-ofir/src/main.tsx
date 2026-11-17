import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Catalogo from "./legacy-pages/Catalogo";
import Admin from "./legacy-pages/Admin";
import { ProductsProvider } from "./context/ProductsContext";

import Sorteador from "./legacy-pages/Sorteador";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <ProductsProvider>
    <BrowserRouter>
      <Routes>
        {/*<Route path="/" element={<App />} />*/}
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/admin-velas-2024" element={<Admin />} />
        <Route path="/sorteador" element={<Sorteador />} />
      </Routes>
    </BrowserRouter>
  </ProductsProvider>
);
