// src/App.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";

// Punto central donde React Router toma el control del SPA completo.
export default function App() {
  return <RouterProvider router={router} />;
}
