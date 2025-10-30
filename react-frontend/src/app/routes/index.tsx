import { createRoutesFromElements, Route } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import { ProtectedRoute } from "../layout/ProtectedRoute";
import Login from "../../features/auth/Login";
import Dashboard from "../../features/dashboard/Dashboard";
import ProductsPage from "../../features/products/ProductsPage";

export const routes = createRoutesFromElements(
  <>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/productos" element={<ProductsPage />} />
        {/* agrega más: /ventas, /clientes, etc. */}
      </Route>
    </Route>
  </>
);
