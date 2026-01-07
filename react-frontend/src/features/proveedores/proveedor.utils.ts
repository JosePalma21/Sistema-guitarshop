import type { ProveedorRecord } from "./proveedor.types"

export const matchesProveedorSearch = (proveedor: ProveedorRecord, search: string) => {
	if (!search) return true
	const nombre = proveedor.nombre_proveedor.toLowerCase()
	const ruc = proveedor.ruc_cedula.toLowerCase()
	const correo = proveedor.correo?.toLowerCase() || ""
	const telefono = proveedor.telefono?.toLowerCase() || ""
	const query = search.toLowerCase()
	return nombre.includes(query) || ruc.includes(query) || correo.includes(query) || telefono.includes(query)
}