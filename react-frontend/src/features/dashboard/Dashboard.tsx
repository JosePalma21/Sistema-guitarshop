"use client"

import { AlertCircle, BarChart3, CreditCard, Package, RefreshCcw, ShoppingBag, Truck, Users } from "lucide-react"
import { useDashboardData } from "../../lib/hooks/useDashboardData"
import { cn } from "../../lib/utils"

const numberFormat = new Intl.NumberFormat("es-EC", { maximumFractionDigits: 0 })

export default function Dashboard() {
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useDashboardData()

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">No pudimos cargar el dashboard</p>
            <p className="text-sm opacity-80">
              {error instanceof Error ? error.message : "Intenta nuevamente en unos segundos."}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) return null

  const statCards = [
    {
      label: "Clientes activos",
      value: data.totalClientes,
      icon: Users,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Productos en catálogo",
      value: data.totalProductos,
      icon: Package,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Proveedores",
      value: data.totalProveedores,
      icon: Truck,
      accent: "bg-purple-50 text-purple-600",
    },
    {
      label: "Cuotas pendientes",
      value: data.cuotasPendientes,
      icon: CreditCard,
      accent: "bg-amber-50 text-amber-600",
    },
  ]

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Resumen general</p>
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Monitorea inventario, ventas y alertas en un solo lugar.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          Actualizar
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{numberFormat.format(value)}</p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", accent)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Actividad comercial</h2>
              <p className="text-sm text-slate-500">Total de facturas y compras registradas.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs uppercase text-slate-500">Ventas totales</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{numberFormat.format(data.totalVentas)}</p>
              <p className="mt-1 text-sm text-slate-500">Facturas emitidas por el equipo</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs uppercase text-slate-500">Compras registradas</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{numberFormat.format(data.totalCompras)}</p>
              <p className="mt-1 text-sm text-slate-500">Abastecimiento con proveedores</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Alertas de inventario</h2>
              <p className="text-sm text-slate-500">Productos con stock menor a 5 unidades.</p>
            </div>
            <ShoppingBag className="h-5 w-5 text-amber-500" />
          </div>
          {data.productosBajoStock.length === 0 ? (
            <p className="text-sm text-slate-500">Inventario saludable. No hay alertas por ahora.</p>
          ) : (
            <ul className="space-y-3">
              {data.productosBajoStock.map((producto) => (
                <li key={producto.id_producto} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-amber-900">{producto.nombre_producto}</p>
                    <p className="text-xs text-amber-700">ID #{producto.id_producto}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                    {producto.cantidad_stock} uds
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {(() => {
          const systemActive = Boolean(data)
          const badgeClasses = systemActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          const dotClasses = systemActive ? "bg-emerald-500" : "bg-red-500"
          const label = systemActive ? "Activo" : "Inactivo"

          return (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Estado del sistema</h2>
                <p className="text-sm text-slate-500">Resultado del último chequeo.</p>
              </div>
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold",
                  badgeClasses
                )}
              >
                <div className={cn("h-2 w-2 animate-pulse rounded-full", dotClasses)} />
                {label}
              </div>
            </div>
          )
        })()}
      </article>
    </div>
  )
}
