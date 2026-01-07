import { api } from "../../lib/apiClient"
import type { ProveedorPayload, ProveedorRecord } from "./proveedor.types"

export const proveedorClient = {
	async list(): Promise<ProveedorRecord[]> {
		const { data } = await api.get<ProveedorRecord[]>("/proveedor")
		if (!Array.isArray(data)) return []
		return data.map((item) => ({
			...item,
			fecha_registro: item.fecha_registro || new Date().toISOString(),
		}))
	},

	async create(payload: ProveedorPayload): Promise<ProveedorRecord> {
		const { data } = await api.post<ProveedorRecord>("/proveedor", payload)
		return data
	},

	async update(proveedorId: number, payload: ProveedorPayload): Promise<ProveedorRecord> {
		const { data } = await api.put<ProveedorRecord>(`/proveedor/${proveedorId}`, payload)
		return data
	},

	async remove(proveedorId: number): Promise<void> {
		await api.delete(`/proveedor/${proveedorId}`)
	},
}