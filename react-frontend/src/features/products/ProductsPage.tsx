"use client"

import { useCallback, useMemo, useState } from "react"
import { isAxiosError } from "axios"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Boxes,
  Edit2,
  Image as ImageIcon,
  Loader2,
  Package,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react"

import { api } from "../../lib/apiClient"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { useAuthUser } from "../../lib/hooks/useAuthUser"

type ProductoRecord = {
  id_producto: number
  codigo_producto: string
  nombre_producto: string
  descripcion: string | null
  id_proveedor: number | null
  precio_compra: number
  precio_venta: number
  cantidad_stock: number
  stock_minimo: number
  proveedor?: {
    id_proveedor: number
    nombre_proveedor: string
  } | null
}

type ProveedorRecord = {
  id_proveedor: number
  nombre_proveedor: string
}

const isValidUrl = (value: string) => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

// Espejo de las restricciones Prisma para evitar errores al sincronizar productos.
const productoSchema = z.object({
  codigo_producto: z.string().trim().min(1, "El código es obligatorio").max(30, "Máximo 30 caracteres"),
  nombre_producto: z.string().trim().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  descripcion: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .or(z.literal("")),
  imagen_url: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .refine(
      (value) => value.length === 0 || isValidUrl(value),
      "Ingresa un enlace válido para la imagen"
    ),
  precio_compra: z.number().nonnegative("No puede ser negativo"),
  precio_venta: z.number().nonnegative("No puede ser negativo"),
  cantidad_stock: z.number().int("Debe ser entero").min(0, "No puede ser negativo"),
  stock_minimo: z.number().int("Debe ser entero").min(0, "No puede ser negativo"),
  id_proveedor: z
    .string()
    .min(1, "Selecciona un proveedor")
    .refine((value) => {
      const parsed = Number(value)
      return Number.isInteger(parsed) && parsed > 0
    }, "Selecciona un proveedor válido"),
})

type ProductoFormValues = z.infer<typeof productoSchema>

type ProductoPayload = {
  codigo_producto: string
  nombre_producto: string
  descripcion: string | null
  id_proveedor: number
  precio_compra: number
  precio_venta: number
  cantidad_stock: number
  stock_minimo: number
}

// Reutilizamos el mismo formato monetario en tarjetas, tabla y resumen.
const currency = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

// Valores iniciales para abrir el modal listo para escribir.
const defaultValues: Partial<ProductoFormValues> = {
  codigo_producto: "",
  nombre_producto: "",
  descripcion: "",
  imagen_url: "",
  precio_compra: 0,
  precio_venta: 0,
  cantidad_stock: 0,
  stock_minimo: 0,
  id_proveedor: "",
}

type ApiErrorResponse = {
  error?: string
  message?: string
}

// Helper estándar para surfear los mensajes del backend.
const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? error.response?.data?.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export default function ProductsPage() {
  const { isAdmin } = useAuthUser()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductoRecord | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Hook principal del formulario con todas las reglas de zodResolver.
  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues,
  })

  const watchedImageUrl = form.watch("imagen_url")
  const imagePreview = useMemo(() => {
    const trimmed = watchedImageUrl?.trim()
    if (!trimmed) return null
    try {
      return new URL(trimmed).toString()
    } catch {
      return null
    }
  }, [watchedImageUrl])

  // Lista completa de productos, ya con números normalizados.
  const productosQuery = useQuery<ProductoRecord[]>({
    queryKey: ["productos"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ProductoRecord[]>("/producto")
      if (!Array.isArray(data)) return []
      return data.map((item) => ({
        ...item,
        precio_compra: Number(item.precio_compra ?? 0),
        precio_venta: Number(item.precio_venta ?? 0),
        cantidad_stock: Number(item.cantidad_stock ?? 0),
        stock_minimo: Number(item.stock_minimo ?? 0),
      }))
    },
  })

  // Sirve para poblar el combo de proveedores dentro del modal.
  const proveedoresQuery = useQuery<ProveedorRecord[]>({
    queryKey: ["proveedores"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ProveedorRecord[]>("/proveedor")
      return Array.isArray(data) ? data : []
    },
  })

  // Consumimos el store de imágenes separado para no mezclarlo con Prisma.
  const imagenesQuery = useQuery<Record<number, string>>({
    queryKey: ["product-images"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<Record<string, string>>("/producto/imagen")
      const normalized: Record<number, string> = {}
      if (data && typeof data === "object") {
        Object.entries(data).forEach(([key, value]) => {
          const id = Number(key)
          if (!Number.isNaN(id) && typeof value === "string" && value.trim().length > 0) {
            normalized[id] = value
          }
        })
      }
      return normalized
    },
  })

  // Este servicio guarda la URL compartida del producto y refresca la cache local.
  const saveProductImage = useCallback(
    async (productId: number, url: string | null) => {
      await api.post("/producto/imagen", {
        id_producto: productId,
        imagen_url: url,
      })
      queryClient.invalidateQueries({ queryKey: ["product-images"] })
    },
    [queryClient]
  )

  // Resetea el formulario y oculta el modal.
  const closeDialog = () => {
    setDialogOpen(false)
    setEditingProduct(null)
    setFormError(null)
    form.reset(defaultValues)
  }

  // Prepara la UI para un alta desde cero.
  const openCreate = () => {
    setEditingProduct(null)
    setFormError(null)
    form.reset(defaultValues)
    setDialogOpen(true)
  }

  // Llena el formulario con el producto seleccionado, incluyendo imagen en caché.
  const openEdit = (producto: ProductoRecord) => {
    setEditingProduct(producto)
    setFormError(null)
    form.reset({
      codigo_producto: producto.codigo_producto,
      nombre_producto: producto.nombre_producto,
      descripcion: producto.descripcion ?? "",
      imagen_url: imageMap[producto.id_producto] ?? "",
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      cantidad_stock: producto.cantidad_stock,
      stock_minimo: producto.stock_minimo,
      id_proveedor: producto.id_proveedor ? String(producto.id_proveedor) : "",
    })
    setDialogOpen(true)
  }

  // POST /producto y luego guarda la imagen en el store secundario.
  const createMutation = useMutation({
    mutationFn: ({ payload }: { payload: ProductoPayload; imageUrl: string | null }) =>
      api.post<ProductoRecord>("/producto", payload).then((res) => res.data),
    onSuccess: async (data, variables) => {
      try {
        await saveProductImage(data.id_producto, variables.imageUrl)
      } catch (error) {
        setFormError(getApiErrorMessage(error, "No se pudo guardar la imagen"))
        return
      }
      queryClient.invalidateQueries({ queryKey: ["productos"] })
      closeDialog()
    },
    onError: (error: unknown) => {
      setFormError(getApiErrorMessage(error, "No se pudo crear el producto"))
    },
  })

  // PUT /producto/:id + actualización de imagen para mantener consistencia.
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductoPayload; imageUrl: string | null }) =>
      api.put(`/producto/${id}`, payload).then((res) => res.data),
    onSuccess: async (data, variables) => {
      try {
        await saveProductImage(data.id_producto, variables.imageUrl)
      } catch (error) {
        setFormError(getApiErrorMessage(error, "No se pudo guardar la imagen"))
        return
      }
      queryClient.invalidateQueries({ queryKey: ["productos"] })
      closeDialog()
    },
    onError: (error: unknown) => {
      setFormError(getApiErrorMessage(error, "No se pudo actualizar el producto"))
    },
  })

  // DELETE /producto/:id, y de inmediato limpiamos la imagen persistida.
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/producto/${id}`),
    onSuccess: async (_, id) => {
      try {
        await saveProductImage(id, null)
      } catch (error) {
        console.error("No se pudo limpiar la imagen del producto", error)
      }
      queryClient.invalidateQueries({ queryKey: ["productos"] })
    },
  })

  // Handler único para crear o editar según exista `editingProduct`.
  const onSubmit = form.handleSubmit((values) => {
    const imageUrl = values.imagen_url?.trim() ? values.imagen_url.trim() : null
    const proveedorId = Number(values.id_proveedor)

    const payload: ProductoPayload = {
      codigo_producto: values.codigo_producto.trim(),
      nombre_producto: values.nombre_producto.trim(),
      descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null,
      id_proveedor: proveedorId,
      precio_compra: values.precio_compra,
      precio_venta: values.precio_venta,
      cantidad_stock: values.cantidad_stock,
      stock_minimo: values.stock_minimo,
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id_producto, payload, imageUrl })
    } else {
      createMutation.mutate({ payload, imageUrl })
    }
  })

  // Pedimos confirmación básica para evitar borrar inventario sin querer.
  const handleDelete = (producto: ProductoRecord) => {
    if (deleteMutation.isPending) return
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar ${producto.nombre_producto}? Esta acción es permanente.`
    )
    if (confirmed) {
      deleteMutation.mutate(producto.id_producto)
    }
  }

  const productos = useMemo(() => productosQuery.data ?? [], [productosQuery.data])
  const proveedores = proveedoresQuery.data ?? []
  const imageMap = imagenesQuery.data ?? {}
  const lowStock = useMemo(() => productos.filter((p) => p.cantidad_stock <= p.stock_minimo), [productos])
  const noProveedoresDisponibles = !proveedoresQuery.isLoading && proveedores.length === 0
  const isMutating = createMutation.isPending || updateMutation.isPending

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3 text-amber-800">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="font-semibold">Acceso restringido</p>
            <p className="text-sm">Solo usuarios con rol ADMIN pueden administrar productos.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Inventario</p>
          <h1 className="text-3xl font-semibold text-slate-900">Productos</h1>
          <p className="mt-1 text-sm text-slate-500">Visualiza, crea y actualiza todo tu catálogo.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={openCreate}
            disabled={noProveedoresDisponibles}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
          {noProveedoresDisponibles && (
            <p className="text-xs text-amber-700">
              Crea un proveedor para habilitar este módulo.
            </p>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Total registrados</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{productos.length}</p>
          <p className="text-sm text-slate-500">Productos activos según Prisma</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Stock crítico</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{lowStock.length}</p>
          <p className="text-sm text-slate-500">Con stock menor o igual al mínimo</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Proveedores activos</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{proveedores.length}</p>
          <p className="text-sm text-slate-500">Fuente para nuevas compras</p>
        </article>
      </section>

      {(productosQuery.isError || proveedoresQuery.isError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Error al cargar datos. Intenta nuevamente.
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Precios</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {productos.map((producto) => {
                const critical = producto.cantidad_stock <= producto.stock_minimo
                const previewImage = imageMap[producto.id_producto] ?? null
                return (
                  <tr key={producto.id_producto} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{producto.codigo_producto}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt={producto.nombre_producto}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{producto.nombre_producto}</p>
                          {producto.descripcion && (
                            <p className="text-xs text-slate-500">{producto.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {producto.proveedor?.nombre_proveedor ?? "Sin proveedor"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div>
                        <span className="font-medium text-slate-900">Venta:</span> {currency.format(producto.precio_venta)}
                      </div>
                      <div>
                        <span className="text-slate-500">Compra:</span> {currency.format(producto.precio_compra)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          critical ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <Boxes className="h-3.5 w-3.5" />
                        {producto.cantidad_stock} uds
                      </span>
                      <p className="text-xs text-slate-500">Mínimo: {producto.stock_minimo}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(producto)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(producto)}
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {productosQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 p-6 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando productos...
          </div>
        )}

        {!productosQuery.isLoading && productos.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <Package size={36} className="mx-auto mb-2 opacity-50" />
            <p>No hay productos registrados.</p>
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          } else {
            setDialogOpen(true)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            <DialogDescription>Todos los campos se validan con el esquema del backend.</DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Código</label>
                <input
                  {...form.register("codigo_producto")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.codigo_producto && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.codigo_producto.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Nombre</label>
                <input
                  {...form.register("nombre_producto")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.nombre_producto && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.nombre_producto.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase text-slate-500">Descripción</label>
              <textarea
                rows={3}
                {...form.register("descripcion")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Materiales, marca, observaciones..."
              />
              {form.formState.errors.descripcion && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.descripcion.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium uppercase text-slate-500">Imagen compartida (URL pública)</label>
              <input
                {...form.register("imagen_url")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="https://mis-imagenes.com/producto.jpg"
              />
              {form.formState.errors.imagen_url && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.imagen_url.message}</p>
              )}
              {imagePreview && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={imagePreview}
                    alt="Vista previa del producto"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <p className="text-xs text-slate-500">
                    Se mostrará en todos los puestos de venta al guardar el formulario.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Precio de compra</label>
                <input
                  type="number"
                  step="0.01"
                  {...form.register("precio_compra", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.precio_compra && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.precio_compra.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Precio de venta</label>
                <input
                  type="number"
                  step="0.01"
                  {...form.register("precio_venta", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.precio_venta && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.precio_venta.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Stock actual</label>
                <input
                  type="number"
                  {...form.register("cantidad_stock", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.cantidad_stock && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.cantidad_stock.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Stock mínimo</label>
                <input
                  type="number"
                  {...form.register("stock_minimo", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.stock_minimo && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.stock_minimo.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase text-slate-500">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <select
                {...form.register("id_proveedor")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={proveedoresQuery.isLoading || noProveedoresDisponibles}
                defaultValue=""
              >
                <option value="">Selecciona un proveedor</option>
                {proveedores.map((prov) => (
                  <option key={prov.id_proveedor} value={prov.id_proveedor}>
                    {prov.nombre_proveedor}
                  </option>
                ))}
              </select>
              {proveedoresQuery.isLoading && (
                <p className="mt-1 text-xs text-slate-500">Cargando proveedores...</p>
              )}
              {noProveedoresDisponibles && (
                <p className="mt-1 text-xs text-amber-600">
                  No hay proveedores registrados. Registra uno en el módulo correspondiente.
                </p>
              )}
              {form.formState.errors.id_proveedor && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.id_proveedor.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isMutating || noProveedoresDisponibles}
              >
                {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
