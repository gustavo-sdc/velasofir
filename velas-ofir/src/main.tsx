import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Catalogo from "./pages/Catalogo";
import Admin from "./pages/Admin";
import { ProductsProvider } from "./context/ProductsContext";

import "./index.css";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <ProductsProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/admin-velas-2024" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </ProductsProvider>
);
