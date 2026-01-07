"use client"

import { useState } from "react"
import { X } from "lucide-react"

type ComprasFiltersDrawerProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onApplyFilters: (filters: {
		fechaDesde: string
		fechaHasta: string
		proveedor: string
		totalMin: string
		totalMax: string
	}) => void
	initialFilters: {
		fechaDesde: string
		fechaHasta: string
		proveedor: string
		totalMin: string
		totalMax: string
	}
	proveedores: Array<{
		id_proveedor: number
		nombre_proveedor: string
	}>
}

export function ComprasFiltersDrawer({
	open,
	onOpenChange,
	onApplyFilters,
	initialFilters,
	proveedores,
}: ComprasFiltersDrawerProps) {
	const [fechaDesde, setFechaDesde] = useState(initialFilters.fechaDesde)
	const [fechaHasta, setFechaHasta] = useState(initialFilters.fechaHasta)
	const [proveedor, setProveedor] = useState(initialFilters.proveedor)
	const [totalMin, setTotalMin] = useState(initialFilters.totalMin)
	const [totalMax, setTotalMax] = useState(initialFilters.totalMax)

	const handleApply = () => {
		onApplyFilters({
			fechaDesde,
			fechaHasta,
			proveedor,
			totalMin,
			totalMax,
		})
	}

	const handleClear = () => {
		setFechaDesde("")
		setFechaHasta("")
		setProveedor("")
		setTotalMin("")
		setTotalMax("")
	}

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => onOpenChange(false)}>
			<div className="w-full max-w-md rounded-t-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-slate-900">Filtros de Compras</h2>
						<p className="text-sm text-slate-500">
							Configura los filtros para mostrar las compras que deseas ver.
						</p>
					</div>
					<button
						onClick={() => onOpenChange(false)}
						className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="mt-6 space-y-6">
					<div>
						<label className="text-sm font-medium text-slate-700 mb-2 block">Fecha desde</label>
						<input
							type="date"
							value={fechaDesde}
							onChange={(e) => setFechaDesde(e.target.value)}
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-slate-700 mb-2 block">Fecha hasta</label>
						<input
							type="date"
							value={fechaHasta}
							onChange={(e) => setFechaHasta(e.target.value)}
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-slate-700 mb-2 block">Proveedor</label>
						<select
							value={proveedor}
							onChange={(e) => setProveedor(e.target.value)}
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
						>
							<option value="">Todos los proveedores</option>
							{proveedores.map((prov) => (
								<option key={prov.id_proveedor} value={prov.nombre_proveedor}>
									{prov.nombre_proveedor}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="text-sm font-medium text-slate-700 mb-2 block">Total mínimo</label>
						<input
							type="number"
							step="0.01"
							min="0"
							value={totalMin}
							onChange={(e) => setTotalMin(e.target.value)}
							placeholder="0.00"
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-slate-700 mb-2 block">Total máximo</label>
						<input
							type="number"
							step="0.01"
							min="0"
							value={totalMax}
							onChange={(e) => setTotalMax(e.target.value)}
							placeholder="0.00"
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
						/>
					</div>
				</div>

				<div className="mt-8 flex gap-3">
					<button
						onClick={handleClear}
						className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						Limpiar
					</button>
					<button
						onClick={handleApply}
						className="flex-1 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
					>
						Aplicar
					</button>
				</div>
			</div>
		</div>
	)
}