import type { ClienteRecord } from "./cliente.types"

export const getClienteFullName = (cliente: Pick<ClienteRecord, "nombres" | "apellidos">) => {
	return `${cliente.nombres} ${cliente.apellidos}`.trim()
}

export const matchesClienteSearch = (cliente: ClienteRecord, search: string) => {
	if (!search) return true
	const fullName = getClienteFullName(cliente).toLowerCase()
	const cedula = cliente.cedula.toLowerCase()
	const correo = cliente.correo?.toLowerCase() || ""
	const telefono = cliente.telefono?.toLowerCase() || ""
	const query = search.toLowerCase()
	return fullName.includes(query) || cedula.includes(query) || correo.includes(query) || telefono.includes(query)
}