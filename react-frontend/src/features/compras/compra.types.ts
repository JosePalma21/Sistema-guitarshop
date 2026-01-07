export type CompraFilters = {
	orden: "date_desc" | "date_asc" | "total_desc" | "total_asc"
}

export type CompraViewMode = "table" | "cards"

export type CompraPayload = {
	id_proveedor: number
	fecha_compra: string
	total: number
	detalles: {
		id_producto: number
		cantidad: number
		precio_unitario: number
	}[]
}

export type CompraRecord = {
	id_compra: number
	id_proveedor: number
	nombre_proveedor: string
	fecha_compra: string
	total: number
	fecha_registro: string
	detalles?: {
		id_detalle: number
		id_producto: number
		nombre_producto: string
		cantidad: number
		precio_unitario: number
		subtotal: number
	}[]
}

export type CompraListRecord = {
	id_compra: number
	fecha_compra: string
	observacion: string | null
	subtotal: number
	impuesto: number
	total: number
	proveedor: {
		id_proveedor: number
		nombre_proveedor: string
	}
	usuario: {
		id_usuario: number
		nombre_completo: string
	}
}

export type CompraDetailRecord = CompraListRecord & {
	producto_compra: Array<{
		id_producto_compra: number
		id_producto: number
		cantidad_compra: number
		costo_unitario: number
		subtotal: number
		producto: {
			nombre_producto: string
			codigo_producto: string
		}
	}>
}

export type ProductoCompraItem = {
	id_producto_compra: number
	id_producto: number
	cantidad_compra: number
	costo_unitario: number
	subtotal: number
	producto: {
		nombre_producto: string
		codigo_producto: string
	}
}