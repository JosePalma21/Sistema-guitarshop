export type SalesFilterChip = {
	key: "estado" | "formaPago" | "fecha"
	label: string
}

type Props = {
	startItem: number
	endItem: number
	resultsCount: number

	searchInput: string
	onSearchInputChange: (next: string) => void

	onOpenFilters: () => void

	pageSize: number
	onChangePageSize: (next: number) => void

	onOpenCreate: () => void
	createDisabled?: boolean

	filterChips: SalesFilterChip[]
	onRemoveChip: (key: SalesFilterChip["key"]) => void
	onClearAllFilters: () => void
}

export function SalesListHeader(props: Props) {
	return (
		<div className="px-6 py-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listado</p>
					<p className="mt-1 text-sm font-semibold text-slate-900">Ventas</p>
					<p className="text-xs text-slate-500">
						Mostrando {props.startItem}-{props.endItem} de {props.resultsCount} resultados.
					</p>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
					<input
						value={props.searchInput}
						onChange={(event) => props.onSearchInputChange(event.target.value)}
						placeholder="Buscar por factura, cliente o cédula"
						className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-80"
					/>

					<button
						type="button"
						onClick={props.onOpenFilters}
						className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						Filtros
					</button>

					<div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
						<label htmlFor="sales-page-size" className="text-xs font-semibold text-slate-600">
							Por página
						</label>
						<select
							id="sales-page-size"
							value={String(props.pageSize)}
							onChange={(event) => props.onChangePageSize(Number(event.target.value))}
							className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="8">8</option>
							<option value="16">16</option>
							<option value="24">24</option>
							<option value="32">32</option>
						</select>
					</div>

					<button
						type="button"
						onClick={props.onOpenCreate}
						disabled={props.createDisabled}
						className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Nueva venta
					</button>
				</div>
			</div>

			{props.filterChips.length > 0 && (
				<div className="mt-4 flex flex-wrap items-center gap-2">
					{props.filterChips.map((chip) => (
						<span
							key={chip.key}
							className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
						>
							{chip.label}
							<button
								type="button"
								onClick={() => props.onRemoveChip(chip.key)}
								className="rounded-full px-1 text-slate-500 hover:text-slate-900"
								aria-label="Remover filtro"
							>
								×
							</button>
						</span>
					))}
					<button
						type="button"
						onClick={props.onClearAllFilters}
						className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						Limpiar todo
					</button>
				</div>
			)}
		</div>
	)
}
