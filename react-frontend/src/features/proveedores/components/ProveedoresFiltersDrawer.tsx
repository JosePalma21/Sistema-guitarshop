import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "../../../components/ui/drawer"
import type { ProveedoresFilters, SortValue } from "../proveedor.types"

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
	filters: ProveedoresFilters
	onFiltersChange: (filters: ProveedoresFilters) => void
}

export function ProveedoresFiltersDrawer(props: Props) {
	const handleSortChange = (orden: SortValue) => {
		props.onFiltersChange({ ...props.filters, orden })
	}

	return (
		<Drawer open={props.open} onOpenChange={props.onOpenChange}>
			<DrawerContent className="max-h-[85vh]">
				<DrawerHeader>
					<DrawerTitle>Filtros de Proveedores</DrawerTitle>
					<DrawerDescription>
						Ajusta los filtros para encontrar los proveedores que buscas.
					</DrawerDescription>
				</DrawerHeader>

				<div className="flex flex-col gap-6 p-6">
					<div className="space-y-3">
						<label className="text-sm font-medium text-slate-900">Ordenar por</label>
						<div className="grid grid-cols-2 gap-2">
							<button
								onClick={() => handleSortChange("name_asc")}
								className={`flex h-9 items-center justify-center rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
									props.filters.orden === "name_asc"
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
								}`}
							>
								Nombre A-Z
							</button>
							<button
								onClick={() => handleSortChange("name_desc")}
								className={`flex h-9 items-center justify-center rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
									props.filters.orden === "name_desc"
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
								}`}
							>
								Nombre Z-A
							</button>
							<button
								onClick={() => handleSortChange("date_asc")}
								className={`flex h-9 items-center justify-center rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
									props.filters.orden === "date_asc"
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
								}`}
							>
								Fecha ↑
							</button>
							<button
								onClick={() => handleSortChange("date_desc")}
								className={`flex h-9 items-center justify-center rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
									props.filters.orden === "date_desc"
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
								}`}
							>
								Fecha ↓
							</button>
						</div>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	)
}