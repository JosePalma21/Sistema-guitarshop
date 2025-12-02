import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import ProductForm, {
  type ProductInput,
  type Proveedor,
} from "./components/ProductForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

interface Producto {
  id_producto: number;
  codigo_producto: string;
  nombre_producto: string;
  descripcion: string | null;
  precio_venta: number | string | null;
  // algunos backends pueden devolver también "precio"
  precio?: number | string | null;
  cantidad_stock: number;
  id_proveedor: number | null;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);

  // LISTAR PRODUCTOS
  const {
    data: productos = [],
    isLoading,
    isError,
  } = useQuery<Producto[]>({
    queryKey: ["productos"],
    queryFn: async () => {
      const res = await api.get<any[]>("/producto");
      // Normalizamos para que SIEMPRE tengamos precio_venta
      return res.data.map((p) => ({
        ...p,
        precio_venta: p.precio_venta ?? p.precio ?? 0,
      })) as Producto[];
    },
  });

  // LISTAR PROVEEDORES
  const {
    data: proveedores = [],
    isLoading: loadingProveedores,
  } = useQuery<Proveedor[]>({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const res = await api.get<Proveedor[]>("/proveedor");
      return res.data;
    },
  });

  // CREAR
  const createMutation = useMutation({
  // 👇 usamos any para no pelearnos con TS aquí
  mutationFn: async (formData: any) => {
    setFormError(null);

    const data = formData as any;

    const payload = {
      codigo_producto: data.codigo_producto,
      nombre_producto: data.nombre_producto,
      descripcion: data.descripcion,
      cantidad_stock: data.cantidad_stock,
      id_proveedor: data.id_proveedor,
      // si el form tiene precio_venta lo usamos, si no, precio
      precio: data.precio_venta ?? data.precio,
      precio_venta: data.precio_venta ?? data.precio,
    };

    await api.post("/producto", payload);
  },
  onError: (err: any) => {
    console.error("Error al crear producto", err?.response?.data || err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      "Error al crear el producto.";
    setFormError(msg);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["productos"] });
    setIsFormOpen(false);
  },
});


  // EDITAR
  const updateMutation = useMutation({
  mutationFn: async (payload: { id: number; data: any }) => {
    setFormError(null);

    const d = payload.data as any;

    const body = {
      codigo_producto: d.codigo_producto,
      nombre_producto: d.nombre_producto,
      descripcion: d.descripcion,
      cantidad_stock: d.cantidad_stock,
      id_proveedor: d.id_proveedor,
      precio: d.precio_venta ?? d.precio,
      precio_venta: d.precio_venta ?? d.precio,
    };

    await api.put(`/producto/${payload.id}`, body);
  },
  onError: (err: any) => {
    console.error("Error al actualizar producto", err?.response?.data || err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      "Error al actualizar el producto.";
    setFormError(msg);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["productos"] });
    setIsFormOpen(false);
    setSelectedProduct(null);
  },
});

  // ELIMINAR
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/producto/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    },
  });

  const handleNew = () => {
    setSelectedProduct(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (p: Producto) => {
    setSelectedProduct(p);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (p: Producto) => {
    setSelectedProduct(p);
    setIsDeleteOpen(true);
  };

  const handleSubmitForm = (values: ProductInput) => {
    if (selectedProduct) {
      updateMutation.mutate({
        id: selectedProduct.id_producto,
        data: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedProduct) return;
    deleteMutation.mutate(selectedProduct.id_producto);
  };

  if (isLoading)
    return <div className="text-sm p-2">Cargando productos...</div>;

  if (isError)
    return (
      <div className="text-sm p-2 text-red-600">
        No se pudo cargar la lista de productos.
      </div>
    );

  return (
    <div className="text-slate-900">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Productos</h1>
            <p className="text-sm text-slate-500">
              Gestiona el catálogo de productos de GuitarShop.
            </p>
          </div>
          <button
            onClick={handleNew}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Nuevo producto
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                  ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                  Código
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                  Nombre
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                  Precio
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                  Stock
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {productos && productos.length > 0 ? (
                productos.map((p) => (
                  <tr
                    key={p.id_producto}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2">{p.id_producto}</td>
                    <td className="px-3 py-2">{p.codigo_producto}</td>
                    <td className="px-3 py-2">{p.nombre_producto}</td>
                    <td className="px-3 py-2">
                      {p.precio_venta !== null && p.precio_venta !== undefined
                        ? `$${Number(p.precio_venta).toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2">{p.cantidad_stock}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(p)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-sm text-slate-500"
                  >
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedProduct(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedProduct ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>

          <ProductForm
            defaultValues={
              selectedProduct
                ? ({
                    nombre_producto: selectedProduct.nombre_producto,
                    precio: Number(selectedProduct.precio_venta ?? 0),
                    cantidad_stock: selectedProduct.cantidad_stock,
                    id_proveedor: selectedProduct.id_proveedor ?? 0,
                  } as ProductInput)
                : undefined
            }
            proveedores={proveedores}
            loadingProveedores={loadingProveedores}
            onSubmit={handleSubmitForm}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedProduct(null);
              setFormError(null);
            }}
          />

          {formError && (
            <p className="mt-2 text-xs text-red-600">{formError}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL ELIMINAR */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setSelectedProduct(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              Confirmar eliminación
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-slate-600">
            ¿Seguro que deseas eliminar el producto{" "}
            <span className="font-semibold">
              {selectedProduct?.nombre_producto}
            </span>
            ?
          </p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedProduct(null);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>

          {deleteMutation.isError && (
            <p className="mt-2 text-xs text-red-600">
              Ocurrió un error al eliminar el producto.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
