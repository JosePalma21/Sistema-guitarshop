import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "../../../components/ui/drawer"
import type { ProveedorRecord } from "../proveedor.types"

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void

	proveedor: ProveedorRecord | null

	dateFormatter: Intl.DateTimeFormat

	onEdit: () => void
	onClose: () => void
}

export function ProveedoresDetailDrawer(props: Props) {
	const detailProveedor = props.proveedor

	if (!detailProveedor) return null

	return (
		<Drawer open={props.open} onOpenChange={props.onOpenChange}>
			<DrawerContent className="max-h-[85vh]">
				<DrawerHeader>
					<DrawerTitle>{detailProveedor.nombre_proveedor}</DrawerTitle>
					<DrawerDescription>
						Detalles del proveedor y su información de contacto.
					</DrawerDescription>
				</DrawerHeader>

				<div className="flex flex-col gap-6 p-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label className="text-sm font-medium text-slate-500">Nombre del Proveedor</label>
							<p className="mt-1 text-sm text-slate-900">{detailProveedor.nombre_proveedor}</p>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-500">RUC/Cédula</label>
							<p className="mt-1 text-sm text-slate-900">{detailProveedor.ruc_cedula}</p>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-500">Fecha de Registro</label>
							<p className="mt-1 text-sm text-slate-900">
								{props.dateFormatter.format(new Date(detailProveedor.fecha_registro))}
							</p>
						</div>
						<div className="sm:col-span-2">
							<label className="text-sm font-medium text-slate-500">Correo</label>
							<p className="mt-1 text-sm text-slate-900">
								{detailProveedor.correo || <span className="text-slate-500">No especificado</span>}
							</p>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-500">Teléfono</label>
							<p className="mt-1 text-sm text-slate-900">
								{detailProveedor.telefono || <span className="text-slate-500">No especificado</span>}
							</p>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-500">Dirección</label>
							<p className="mt-1 text-sm text-slate-900">
								{detailProveedor.direccion || <span className="text-slate-500">No especificada</span>}
							</p>
						</div>
					</div>

					<div className="flex justify-end gap-3">
						<button
							onClick={props.onClose}
							className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
						>
							Cerrar
						</button>
						<button
							onClick={props.onEdit}
							className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white shadow transition-colors hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
						>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
							Editar
						</button>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	)
}