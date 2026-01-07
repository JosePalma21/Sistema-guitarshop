export type ProveedorRecord = {
	id_proveedor: number
	nombre_proveedor: string
	ruc_cedula: string
	correo: string | null
	telefono: string | null
	direccion: string | null
	fecha_registro: string
}

export type SortValue =
	| "name_asc"
	| "name_desc"
	| "date_asc"
	| "date_desc"

export type ProveedoresFilters = {
	orden: SortValue
}

export type ProveedoresViewMode = "table" | "cards"

export type ProveedorPayload = {
	nombre_proveedor: string
	ruc_cedula: string
	correo: string | null
	telefono: string | null
	direccion: string | null
}