// src/app/routes/index.tsx
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import Login from "../../features/auth/Login";
import Dashboard from "../../features/dashboard/Dashboard";
import ProductsPage from "../../features/products/ProductsPage";

// 👇 AQUÍ armamos el router completo
export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productos" element={<ProductsPage />} />
          {/* aquí luego agregas /ventas, /clientes, etc. */}
        </Route>
      </Route>
    </>
  )
);
