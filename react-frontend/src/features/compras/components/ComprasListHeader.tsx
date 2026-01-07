"use client"

import { Download, Filter, Grid3X3, List, Plus, Search } from "lucide-react"

type ComprasListHeaderProps = {
	startItem: number
	endItem: number
	resultsCount: number
	searchInput: string
	onSearchInputChange: (value: string) => void
	onOpenFilters: () => void
	viewMode: "table" | "cards"
	onChangeViewMode: (mode: "table" | "cards") => void
	pageSize: number
	onChangePageSize: (size: number) => void
	onOpenCreate: () => void
	onOpenExport: () => void
	filterChips: { key: string; label: string }[]
	onRemoveChip: (key: string) => void
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export function ComprasListHeader({
	startItem,
	endItem,
	resultsCount,
	searchInput,
	onSearchInputChange,
	onOpenFilters,
	viewMode,
	onChangeViewMode,
	pageSize,
	onChangePageSize,
	onOpenCreate,
	onOpenExport,
	filterChips,
	onRemoveChip,
}: ComprasListHeaderProps) {
	return (
		<div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Compras</h1>
					<p className="text-sm text-slate-600">
						{resultsCount === 0
							? "No hay compras"
							: `Mostrando ${startItem}-${endItem} de ${resultsCount} compras`}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={onOpenCreate}
						className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900/90"
					>
						<Plus className="h-4 w-4" />
						Nueva Compra
					</button>
				</div>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-2">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							placeholder="Buscar por proveedor o ID..."
							value={searchInput}
							onChange={(e) => onSearchInputChange(e.target.value)}
							className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 pl-9 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
						/>
					</div>
					<button
						onClick={onOpenFilters}
						className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						<Filter className="h-4 w-4" />
						Filtros
					</button>
				</div>

				<div className="flex items-center gap-2">
					<div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white">
						<button
							type="button"
							onClick={() => onChangeViewMode("table")}
							className={
								"px-4 py-2.5 text-sm font-semibold transition " +
								(viewMode === "table" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50")
							}
						>
							<List className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => onChangeViewMode("cards")}
							className={
								"px-4 py-2.5 text-sm font-semibold transition " +
								(viewMode === "cards" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50")
							}
						>
							<Grid3X3 className="h-4 w-4" />
						</button>
					</div>

					<select
						value={pageSize}
						onChange={(e) => onChangePageSize(Number(e.target.value))}
						className="rounded-md border border-slate-200 px-3 py-1 text-sm"
					>
						{PAGE_SIZE_OPTIONS.map((size) => (
							<option key={size} value={size}>
								{size} por página
							</option>
						))}
					</select>

					<button
						onClick={onOpenExport}
						className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						<Download className="h-4 w-4" />
						Exportar
					</button>
				</div>
			</div>

			{filterChips.length > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm font-medium text-slate-700">Filtros activos:</span>
					{filterChips.map((chip) => (
						<div
							key={chip.key}
							className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm"
						>
							<span>{chip.label}</span>
							<button
								onClick={() => onRemoveChip(chip.key)}
								className="ml-1 rounded-full hover:bg-slate-200"
							>
								×
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}