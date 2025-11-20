import { useEffect, useState } from "react";
import { api } from "../../lib/apiClient";

interface Producto {
  id_producto: number;
  nombre_producto: string;
  precio: number;
  cantidad_stock: number;
}

export default function ProductsPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<Producto[]>("/producto");
        setProductos(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la lista de productos.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  if (loading) return <div className="p-4">Cargando productos...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-4xl py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Productos</h1>

        {productos.length === 0 ? (
          <p>No hay productos registrados.</p>
        ) : (
          <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
            <thead className="bg-slate-200">
              <tr>
                <th className="text-left p-2 border-b">ID</th>
                <th className="text-left p-2 border-b">Nombre</th>
                <th className="text-left p-2 border-b">Precio</th>
                <th className="text-left p-2 border-b">Stock</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id_producto} className="hover:bg-slate-50">
                  <td className="p-2 border-b">{p.id_producto}</td>
                  <td className="p-2 border-b">{p.nombre_producto}</td>
                  <td className="p-2 border-b">${p.precio.toFixed(2)}</td>
                  <td className="p-2 border-b">{p.cantidad_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
