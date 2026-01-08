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
  Plus,
  ShieldAlert,
} from "lucide-react"

import { api } from "../../lib/apiClient"
import { useAuthUser } from "../../lib/hooks/useAuthUser"
import { ComprasListHeader } from "./components/ComprasListHeader"
import { ComprasFiltersDrawer } from "./components/ComprasFiltersDrawer"
import { ComprasDetailDrawer } from "./components/ComprasDetailDrawer"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"

import type { CompraDetailRecord, ProductoCompraItem } from "./compra.types"
import { exportToCSV, exportToXLSX, exportToPDF, type ExportRow } from "./exportCompras"

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

type DetalleCompra = z.infer<typeof detalleSchema>

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

  // Estado para funcionalidades avanzadas
  const [searchInput, setSearchInput] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [pageSize, setPageSize] = useState(16)
  const [currentPage, setCurrentPage] = useState(1)

  // Filtros
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [proveedorFilter, setProveedorFilter] = useState("")
  const [totalMin, setTotalMin] = useState("")
  const [totalMax, setTotalMax] = useState("")

  // Estados para exportación
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "done">("idle")
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportScope, setExportScope] = useState<"page" | "filtered" | "all">("filtered")
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("xlsx")

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
    queryKey: ["productos-catalogo"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ProductoOption[]>("/producto")
      if (!Array.isArray(data)) return []
      return data.map((item: ProductoOption) => ({
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
    detalle: values.detalle.map((item: DetalleCompra) => ({
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

  // Funciones para filtros y navegación
  const openFilters = () => setFiltersOpen(true)
  const closeFilters = () => setFiltersOpen(false)

  const applyFilters = (filters: {
    fechaDesde: string
    fechaHasta: string
    proveedor: string
    totalMin: string
    totalMax: string
  }) => {
    setFechaDesde(filters.fechaDesde)
    setFechaHasta(filters.fechaHasta)
    setProveedorFilter(filters.proveedor)
    setTotalMin(filters.totalMin)
    setTotalMax(filters.totalMax)
    setCurrentPage(1) // Reset a primera página
    closeFilters()
  }

  const removeChip = (key: string) => {
    switch (key) {
      case "fechaDesde": setFechaDesde(""); break
      case "fechaHasta": setFechaHasta(""); break
      case "proveedor": setProveedorFilter(""); break
      case "totalMin": setTotalMin(""); break
      case "totalMax": setTotalMax(""); break
    }
    setCurrentPage(1)
  }

  const handleChangePageSize = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const compras = useMemo(() => comprasQuery.data ?? [], [comprasQuery.data])
  const proveedores = proveedoresQuery.data ?? []
  const productos = productosQuery.data ?? []

  // Lógica de filtrado y búsqueda
  const filteredCompras = useMemo(() => {
    let filtered = compras

    // Filtro de búsqueda
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase()
      filtered = filtered.filter(compra =>
        compra.proveedor?.nombre_proveedor.toLowerCase().includes(searchLower) ||
        compra.id_compra.toString().includes(searchLower) ||
        compra.fecha_compra.includes(searchLower)
      )
    }

    // Filtros avanzados
    if (fechaDesde) {
      filtered = filtered.filter(compra => compra.fecha_compra >= fechaDesde)
    }
    if (fechaHasta) {
      filtered = filtered.filter(compra => compra.fecha_compra <= fechaHasta)
    }
    if (proveedorFilter) {
      filtered = filtered.filter(compra => compra.proveedor?.nombre_proveedor === proveedorFilter)
    }
    if (totalMin) {
      const min = parseFloat(totalMin)
      filtered = filtered.filter(compra => compra.total >= min)
    }
    if (totalMax) {
      const max = parseFloat(totalMax)
      filtered = filtered.filter(compra => compra.total <= max)
    }

    return filtered
  }, [compras, searchInput, fechaDesde, fechaHasta, proveedorFilter, totalMin, totalMax])

  // Paginación
  const totalPages = Math.ceil(filteredCompras.length / pageSize)
  const paginatedCompras = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCompras.slice(startIndex, startIndex + pageSize)
  }, [filteredCompras, currentPage, pageSize])

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, filteredCompras.length)

  // Chips de filtros activos
  const filterChips = useMemo(() => {
    const chips = []
    if (fechaDesde) chips.push({ key: "fechaDesde", label: `Desde: ${fechaDesde}` })
    if (fechaHasta) chips.push({ key: "fechaHasta", label: `Hasta: ${fechaHasta}` })
    if (proveedorFilter) chips.push({ key: "proveedor", label: `Proveedor: ${proveedorFilter}` })
    if (totalMin) chips.push({ key: "totalMin", label: `Total min: $${totalMin}` })
    if (totalMax) chips.push({ key: "totalMax", label: `Total max: $${totalMax}` })
    return chips
  }, [fechaDesde, fechaHasta, proveedorFilter, totalMin, totalMax])

  // Funciones auxiliares para exportación
  const getSourceForExport = async (scope: "page" | "filtered" | "all") => {
    if (scope === "page") return paginatedCompras
    if (scope === "filtered") return filteredCompras
    // all
    if (comprasQuery.data) return compras
    const fetched = await queryClient.fetchQuery({
      queryKey: ["compras"],
      queryFn: async () => {
        const { data } = await api.get<CompraListRecord[]>("/compra")
        return Array.isArray(data) ? data : []
      }
    })
    return fetched ?? []
  }

  const buildExportRows = (records: CompraListRecord[]): ExportRow[] => {
    return records.map((compra) => ({
      "ID Compra": compra.id_compra.toString(),
      "Proveedor": compra.proveedor.nombre_proveedor,
      "Fecha Compra": dateFormatter.format(new Date(compra.fecha_compra)),
      "Total": currency.format(compra.total),
      "Fecha Registro": dateFormatter.format(new Date(compra.fecha_compra)), // Usamos fecha_compra como fecha_registro
    }))
  }

  const runExport = async (): Promise<boolean> => {
    setExportError(null)
    setExportStatus("exporting")
    try {
      const source = await getSourceForExport(exportScope)
      const rows = buildExportRows(source)
      if (rows.length === 0) {
        setExportError("No hay compras para exportar")
        setExportStatus("idle")
        return false
      }
      const filenameBase = `compras_${exportScope}_${new Date().toISOString().split('T')[0]}`
      switch (exportFormat) {
        case "csv":
          exportToCSV(rows, filenameBase)
          break
        case "xlsx":
          exportToXLSX(rows, filenameBase)
          break
        case "pdf":
          exportToPDF(rows, filenameBase)
          break
      }
      setExportStatus("done")
      return true
    } catch (error) {
      setExportError("No se pudo exportar")
      setExportStatus("idle")
      return false
    }
  }

  // KPIs que alimentan las tarjetas superiores.
  const totalInvertido = useMemo(
    () => compras.reduce((acc, compra) => acc + (compra.total ?? 0), 0),
    [compras]
  )

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

      <section aria-labelledby="compras-listado" className="rounded-2xl border border-slate-200 bg-white">
        <ComprasListHeader
          startItem={startItem}
          endItem={endItem}
          resultsCount={filteredCompras.length}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onOpenFilters={openFilters}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          pageSize={pageSize}
          onChangePageSize={handleChangePageSize}
          onOpenCreate={openCreate}
          onOpenExport={() => {
            setExportStatus("idle")
            setExportError(null)
            setExportDialogOpen(true)
          }}
          filterChips={filterChips}
          onRemoveChip={removeChip}
        />

        {viewMode === "table" ? (
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
                {paginatedCompras.map((compra: CompraListRecord) => (
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
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedCompras.map((compra: CompraListRecord) => (
              <div key={compra.id_compra} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Compra #{compra.id_compra}</p>
                    <p className="text-sm text-slate-500">{dateFormatter.format(new Date(compra.fecha_compra))}</p>
                  </div>
                  <button
                    onClick={() => setDetailId(compra.id_compra)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Proveedor:</span> {compra.proveedor?.nombre_proveedor ?? "—"}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Total:</span> {currency.format(compra.total ?? 0)}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Usuario:</span> {compra.usuario?.nombre_completo ?? "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estados de carga y vacío */}
        {comprasQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 p-6 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando compras...
          </div>
        )}

        {!comprasQuery.isLoading && paginatedCompras.length === 0 && filteredCompras.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <ClipboardList size={36} className="mx-auto mb-2 opacity-50" />
            <p>No hay compras registradas.</p>
          </div>
        )}

        {!comprasQuery.isLoading && paginatedCompras.length === 0 && filteredCompras.length > 0 && (
          <div className="p-8 text-center text-slate-500">
            <ClipboardList size={36} className="mx-auto mb-2 opacity-50" />
            <p>No se encontraron compras con los filtros aplicados.</p>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDialog}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 sm:p-10" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Registrar compra</h2>
              <p className="text-sm text-slate-600">Los movimientos actualizarán stock y kardex automáticamente.</p>
            </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-8">

            <div className="mt-4 space-y-5">


              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
Proveedor</label>
                <select
                  {...form.register("id_proveedor", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  disabled={proveedoresQuery.isLoading}
                >
                  <option value={0}>Selecciona un proveedor</option>
                  {proveedores.map((prov: ProveedorOption) => (
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
                  <Plus className="h-3.5 w-3.5" /> Añadir
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
                        {productos.map((prod: ProductoOption) => (
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
          </div>
        </div>
      )}

      {detailId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailId(null)}>
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Detalle de compra</h2>
              <p className="text-sm text-slate-600">Incluye cabecera y productos asociados.</p>
            </div>

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
                      {compraDetalleQuery.data.producto_compra.map((item: ProductoCompraItem) => (
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
          </div>
        </div>
      )}

      <ComprasFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        onApplyFilters={applyFilters}
        initialFilters={{
          fechaDesde,
          fechaHasta,
          proveedor: proveedorFilter,
          totalMin,
          totalMax,
        }}
        proveedores={proveedores}
      />

      <ComprasDetailDrawer
        open={detailId !== null}
        compra={compraDetalleQuery.data ?? null}
        dateFormatter={dateFormatter}
        onEdit={() => {
          // TODO: Implementar edición
        }}
        onClose={() => setDetailId(null)}
      />

      <Dialog
        open={exportDialogOpen}
        onOpenChange={(open) => {
          // Bloqueado: solo cerrar con botones del modal.
          if (!open) return
          setExportDialogOpen(true)
        }}
      >
        <DialogContent className="max-w-3xl" disableOutsideClose hideCloseButton>
          <DialogHeader>
            <DialogTitle>Exportar compras</DialogTitle>
            <DialogDescription>Selecciona el alcance y el formato de exportación.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-slate-900">Alcance</p>
              <div className="grid gap-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="export-scope"
                    checked={exportScope === "page"}
                    onChange={() => setExportScope("page")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Página actual</p>
                    <p className="text-xs text-slate-500">Lo visible en pantalla según la paginación actual.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="export-scope"
                    checked={exportScope === "filtered"}
                    onChange={() => setExportScope("filtered")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Filtradas</p>
                    <p className="text-xs text-slate-500">Aplica búsqueda + filtros + orden, sin importar página.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="export-scope"
                    checked={exportScope === "all"}
                    onChange={() => setExportScope("all")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Todo</p>
                    <p className="text-xs text-slate-500">Ignora filtros y exporta todas las compras.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid gap-3">
              <p className="text-sm font-semibold text-slate-900">Formato</p>
              <div className="grid gap-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="export-format"
                    checked={exportFormat === "csv"}
                    onChange={() => setExportFormat("csv")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">CSV</p>
                    <p className="text-xs text-slate-500">Compatible con Excel (separador ;).</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="export-format"
                    checked={exportFormat === "xlsx"}
                    onChange={() => setExportFormat("xlsx")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Excel (.xlsx)</p>
                    <p className="text-xs text-slate-500">Hoja "Compras" con columnas formateadas.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="export-format"
                    checked={exportFormat === "pdf"}
                    onChange={() => setExportFormat("pdf")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">PDF</p>
                    <p className="text-xs text-slate-500">Tabla en PDF (landscape).</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {exportError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{exportError}</div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                if (exportStatus === "exporting") return
                setExportDialogOpen(false)
              }}
              disabled={exportStatus === "exporting"}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await runExport()
                if (ok) setExportDialogOpen(false)
              }}
              disabled={exportStatus === "exporting"}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportStatus === "exporting" ? "Exportando…" : exportStatus === "done" ? "Listo" : "Aceptar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
