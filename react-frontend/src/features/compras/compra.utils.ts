import type { CompraRecord } from "./compra.types"

export function matchesCompraSearch(compra: CompraRecord, search: string): boolean {
	if (!search.trim()) return true

	const searchLower = search.toLowerCase()
	return (
		compra.nombre_proveedor.toLowerCase().includes(searchLower) ||
		compra.id_compra.toString().includes(searchLower) ||
		compra.fecha_compra.includes(search)
	)
}