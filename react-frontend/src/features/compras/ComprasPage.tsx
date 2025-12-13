"use client"

import { useMemo, useState } from "react"
import { isAxiosError } from "axios"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  BadgeDollarSign,
  ClipboardList,
  Eye,
  Loader2,
  PackagePlus,
  Plus,
  ShieldAlert,
  ShoppingCart,
} from "lucide-react"

import { api } from "../../lib/apiClient"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { useAuthUser } from "../../lib/hooks/useAuthUser"

type CompraListRecord = {
  id_compra: number
  fecha_compra: string
  observacion: string | null
  subtotal: number
  impuesto: number
  total: number
  proveedor: {
    id_proveedor: number
    nombre_proveedor: string
  }
  usuario: {
    id_usuario: number
    nombre_completo: string
  }
}

type CompraDetailRecord = CompraListRecord & {
  producto_compra: Array<{
    id_producto_compra: number
    id_producto: number
    cantidad_compra: number
    costo_unitario: number
    subtotal: number
    producto: {
      nombre_producto: string
      codigo_producto: string
    }
  }>
}

type ProveedorOption = {
  id_proveedor: number
  nombre_proveedor: string
}

type ProductoOption = {
  id_producto: number
  nombre_producto: string
  codigo_producto: string
}

// Cada fila del detalle respeta las mismas validaciones que el backend.
const detalleSchema = z.object({
  id_producto: z.number().int("Producto inválido").positive("Selecciona un producto válido"),
  cantidad: z.number().int("Debe ser entero").min(1, "Cantidad mínima 1"),
  costo_unitario: z.number().min(0.01, "Costo mínimo 0.01"),
})

// Cabecera completa: proveedor + observación + listado de productos.
const compraSchema = z.object({
  id_proveedor: z.number().int("Proveedor inválido").positive("Selecciona un proveedor"),
  observacion: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
  detalle: z.array(detalleSchema).min(1, "Agrega al menos un producto al detalle"),
})

type CompraFormValues = z.infer<typeof compraSchema>

type CompraPayload = {
  id_proveedor: number
  observacion: string | null
  detalle: Array<{
    id_producto: number
    cantidad: number
    costo_unitario: number
  }>
}

type ApiErrorResponse = {
  error?: string
  message?: string
}

// Formulario nace con una fila para que el usuario tenga contexto inmediato.
const defaultValues: CompraFormValues = {
  id_proveedor: 0,
  observacion: "",
  detalle: [
    {
      id_producto: 0,
      cantidad: 1,
      costo_unitario: 0,
    },
  ],
}

// Mantenemos todas las cifras de compra en USD con 2 decimales.
const currency = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

// Las fechas de compra muestran día y hora para auditoría rápida.
const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: "short",
})

const IVA_RATE = 0.15 // 15 % IVA

// Error helper compartido entre los mutate y las queries.
const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? error.response?.data?.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export default function ComprasPage() {
  const { isAdmin } = useAuthUser()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // React Hook Form + Zod se encargan de validar cada campo del modal.
  const form = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues,
  })

  // Permite añadir/quitar filas dinámicamente y mantener los índices sincronizados.
  const detalleFieldArray = useFieldArray({ control: form.control, name: "detalle" })

  // Traemos la lista completa de compras sólo para administradores.
  const comprasQuery = useQuery<CompraListRecord[]>({
    queryKey: ["compras"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<CompraListRecord[]>("/compra")
      return Array.isArray(data) ? data : []
    },
  })

  const proveedoresQuery = useQuery<ProveedorOption[]>({
    queryKey: ["proveedores"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ProveedorOption[]>("/proveedor")
      return Array.isArray(data) ? data : []
    },
  })

  // Catálogo resumido para poblar el selector de productos.
  const productosQuery = useQuery<ProductoOption[]>({
    queryKey: ["productos"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ProductoOption[]>("/producto")
      if (!Array.isArray(data)) return []
      return data.map((item) => ({
        id_producto: item.id_producto,
        nombre_producto: item.nombre_producto,
        codigo_producto: item.codigo_producto,
      }))
    },
  })

  // Modal secundario que muestra la compra con sus productos.
  const compraDetalleQuery = useQuery<CompraDetailRecord>({
    queryKey: ["compra", detailId],
    enabled: detailId !== null,
    queryFn: async () => {
      const { data } = await api.get<CompraDetailRecord>(`/compra/${detailId}`)
      return data
    },
  })

  // Limpia todo cuando cerramos el modal principal.
  const closeDialog = () => {
    setDialogOpen(false)
    setFormError(null)
    form.reset(defaultValues)
  }

  // Abre el modal en blanco para la creación.
  const openCreate = () => {
    setFormError(null)
    form.reset(defaultValues)
    setDialogOpen(true)
  }

  // Normalizamos strings y armamos la carga útil que espera el backend.
  const buildPayload = (values: CompraFormValues): CompraPayload => ({
    id_proveedor: values.id_proveedor,
    observacion: values.observacion?.trim() ? values.observacion.trim() : null,
    detalle: values.detalle.map((item) => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      costo_unitario: item.costo_unitario,
    })),
  })

  // POST /compra y posterior invalidación para refrescar la tabla.
  const createMutation = useMutation({
    mutationFn: (payload: CompraPayload) => api.post("/compra", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] })
      closeDialog()
    },
    onError: (error: unknown) => {
      setFormError(getApiErrorMessage(error, "No se pudo registrar la compra"))
    },
  })

  // Handler compartido tanto para crear desde cero como para duplicar futuras compras.
  const onSubmit = form.handleSubmit((values) => {
    createMutation.mutate(buildPayload(values))
  })

  const compras = useMemo(() => comprasQuery.data ?? [], [comprasQuery.data])
  const proveedores = proveedoresQuery.data ?? []
  const productos = productosQuery.data ?? []

  // KPIs que alimentan las tarjetas superiores.
  const totalInvertido = useMemo(
    () => compras.reduce((acc, compra) => acc + (compra.total ?? 0), 0),
    [compras]
  )

  const comprasRecientes = useMemo(() => compras.slice(0, 4), [compras])

  const detalleValues = form.watch("detalle")
  const totals = useMemo(() => {
    const items = Array.isArray(detalleValues) ? detalleValues : []
    let subtotal = 0
    items.forEach((item) => {
      if (item.cantidad && item.costo_unitario) {
        subtotal += item.cantidad * item.costo_unitario
      }
    })
    const impuesto = Number((subtotal * IVA_RATE).toFixed(2))
    const total = Number((subtotal + impuesto).toFixed(2))
    return { subtotal, impuesto, total }
  }, [detalleValues])

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3 text-amber-800">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="font-semibold">Acceso restringido</p>
            <p className="text-sm">Solo usuarios con rol ADMIN pueden gestionar compras.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Logística</p>
          <h1 className="text-3xl font-semibold text-slate-900">Compras</h1>
          <p className="mt-1 text-sm text-slate-500">Controla el abastecimiento y el impacto en inventario.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nueva compra
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Compras registradas</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{compras.length}</p>
          <p className="text-sm text-slate-500">Cabeceras totales en el sistema</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Capital invertido</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{currency.format(totalInvertido)}</p>
          <p className="text-sm text-slate-500">Incluye IVA al 15 %</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Proveedores activos</p>
          <p className="mt-2 text-3xl font-semibold text-purple-600">{proveedores.length}</p>
          <p className="text-sm text-slate-500">Disponibles para nuevas órdenes</p>
        </article>
      </section>

      {comprasQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Error al cargar compras. Intenta nuevamente.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Compra</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Totales</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {compras.map((compra) => (
                  <tr key={compra.id_compra} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">Compra #{compra.id_compra}</p>
                      <p className="text-xs text-slate-500">{dateFormatter.format(new Date(compra.fecha_compra))}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {compra.proveedor?.nombre_proveedor ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <BadgeDollarSign className="h-4 w-4 text-slate-400" />
                        {currency.format(compra.total ?? 0)}
                      </div>
                      <p className="text-xs text-slate-500">
                        Subtotal {currency.format(compra.subtotal ?? 0)} · IVA {currency.format(compra.impuesto ?? 0)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {compra.usuario?.nombre_completo ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDetailId(compra.id_compra)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comprasQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 p-6 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando compras...
            </div>
          )}

          {!comprasQuery.isLoading && compras.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <ClipboardList size={36} className="mx-auto mb-2 opacity-50" />
              <p>No hay compras registradas.</p>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Últimas compras</h2>
              <p className="text-sm text-slate-500">Resumen de los registros más recientes.</p>
            </div>
            <ShoppingCart className="h-5 w-5 text-slate-400" />
          </div>
          {comprasRecientes.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no registras compras.</p>
          ) : (
            <ul className="space-y-3">
              {comprasRecientes.map((compra) => (
                <li key={compra.id_compra} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-900">#{compra.id_compra}</p>
                  <p className="text-xs text-slate-500">
                    {compra.proveedor?.nombre_proveedor ?? "Proveedor no disponible"}
                  </p>
                  <p className="text-xs text-slate-500">{dateFormatter.format(new Date(compra.fecha_compra))}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
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
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar compra</DialogTitle>
            <DialogDescription>Los movimientos actualizarán stock y kardex automáticamente.</DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Proveedor</label>
                <select
                  {...form.register("id_proveedor", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  disabled={proveedoresQuery.isLoading}
                >
                  <option value={0}>Selecciona un proveedor</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id_proveedor} value={prov.id_proveedor}>
                      {prov.nombre_proveedor}
                    </option>
                  ))}
                </select>
                {form.formState.errors.id_proveedor && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.id_proveedor.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Observación</label>
                <input
                  {...form.register("observacion")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ej. Compra inicial"
                />
                {form.formState.errors.observacion && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.observacion.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase text-slate-500">Detalle de productos</label>
                <button
                  type="button"
                  onClick={() => detalleFieldArray.append({ id_producto: 0, cantidad: 1, costo_unitario: 0 })}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                >
                  <PackagePlus className="h-3.5 w-3.5" /> Añadir
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {detalleFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[2fr,1fr,1fr,auto]">
                    <div>
                      <label className="text-[11px] font-medium uppercase text-slate-500">Producto</label>
                      <select
                        {...form.register(`detalle.${index}.id_producto` as const, { valueAsNumber: true })}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        disabled={productosQuery.isLoading}
                      >
                        <option value={0}>Selecciona un producto</option>
                        {productos.map((prod) => (
                          <option key={prod.id_producto} value={prod.id_producto}>
                            {prod.nombre_producto}
                          </option>
                        ))}
                      </select>
                      {form.formState.errors.detalle?.[index]?.id_producto && (
                        <p className="mt-1 text-xs text-red-600">
                          {form.formState.errors.detalle[index]?.id_producto?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] font-medium uppercase text-slate-500">Cantidad</label>
                      <input
                        type="number"
                        step={1}
                        {...form.register(`detalle.${index}.cantidad` as const, { valueAsNumber: true })}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      {form.formState.errors.detalle?.[index]?.cantidad && (
                        <p className="mt-1 text-xs text-red-600">
                          {form.formState.errors.detalle[index]?.cantidad?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] font-medium uppercase text-slate-500">Costo unitario</label>
                      <input
                        type="number"
                        step="0.01"
                        {...form.register(`detalle.${index}.costo_unitario` as const, { valueAsNumber: true })}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      {form.formState.errors.detalle?.[index]?.costo_unitario && (
                        <p className="mt-1 text-xs text-red-600">
                          {form.formState.errors.detalle[index]?.costo_unitario?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <p className="text-xs font-semibold text-slate-600">
                        {currency.format(
                          (detalleValues?.[index]?.cantidad || 0) * (detalleValues?.[index]?.costo_unitario || 0)
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => detalleFieldArray.remove(index)}
                        disabled={detalleFieldArray.fields.length === 1}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:border-slate-300 disabled:opacity-50"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {form.formState.errors.detalle?.message && (
                <p className="mt-2 text-xs text-red-600">{form.formState.errors.detalle.message}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{currency.format(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IVA (15 %)</span>
                <span>{currency.format(totals.impuesto)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{currency.format(totals.total)}</span>
              </div>
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
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailId !== null} onOpenChange={(open) => (!open ? setDetailId(null) : null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de compra</DialogTitle>
            <DialogDescription>Incluye cabecera y productos asociados.</DialogDescription>
          </DialogHeader>

          {compraDetalleQuery.isLoading && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando detalle...
            </div>
          )}

          {compraDetalleQuery.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              No se pudo cargar el detalle. Intenta nuevamente.
            </div>
          )}

          {compraDetalleQuery.data && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-sm font-semibold text-slate-900">
                  Compra #{compraDetalleQuery.data.id_compra}
                </p>
                <p className="text-xs text-slate-500">
                  {dateFormatter.format(new Date(compraDetalleQuery.data.fecha_compra))}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Proveedor: {compraDetalleQuery.data.proveedor?.nombre_proveedor ?? "—"}
                </p>
                <p className="text-sm text-slate-700">
                  Registrada por: {compraDetalleQuery.data.usuario?.nombre_completo ?? "—"}
                </p>
                {compraDetalleQuery.data.observacion && (
                  <p className="text-sm text-slate-500">{compraDetalleQuery.data.observacion}</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Producto</th>
                        <th className="px-4 py-3 text-left">Cantidad</th>
                        <th className="px-4 py-3 text-left">Costo unitario</th>
                        <th className="px-4 py-3 text-left">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {compraDetalleQuery.data.producto_compra.map((item) => (
                        <tr key={item.id_producto_compra}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{item.producto.nombre_producto}</p>
                            <p className="text-xs text-slate-500">{item.producto.codigo_producto}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{item.cantidad_compra}</td>
                          <td className="px-4 py-3 text-slate-700">{currency.format(item.costo_unitario)}</td>
                          <td className="px-4 py-3 text-slate-900 font-semibold">{currency.format(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{currency.format(compraDetalleQuery.data.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>IVA (15 %)</span>
                  <span>{currency.format(compraDetalleQuery.data.impuesto)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{currency.format(compraDetalleQuery.data.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
