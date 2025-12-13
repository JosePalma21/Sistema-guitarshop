// src/app/routes/index.tsx
import {
  Navigate,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import Login from "../../features/auth/Login";
import Dashboard from "../../features/dashboard/Dashboard";
import ProductsPage from "../../features/products/ProductsPage";
import ClientesPage from "../../features/clientes/ClientesPage";
import ProveedoresPage from "../../features/proveedores/ProveedoresPage";
import ComprasPage from "../../features/compras/ComprasPage";
import VentasPage from "../../features/ventas/VentasPage";
import CreditosPage from "../../features/creditos/CreditosPage";

// 👇 AQUÍ armamos el router completo
export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas: ProtectedRoute valida token y AppLayout aporta el shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/creditos" element={<CreditosPage />} />
        </Route>
      </Route>
    </>
  )
);
