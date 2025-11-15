import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./features/auth/Login";
import Dashboard from "./features/dashboard/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Ruta de autenticación */}
      <Route path="/login" element={<Login />} />

      {/* Ruta del dashboard PRINCIPAL (PROTEGIDA) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Cualquier ruta no conocida redirige al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
