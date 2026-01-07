import { api } from "../../lib/apiClient"
import type { ClientePayload, ClienteRecord } from "./cliente.types"

export const clienteClient = {
	async list(): Promise<ClienteRecord[]> {
		const { data } = await api.get<ClienteRecord[]>("/cliente")
		if (!Array.isArray(data)) return []
		return data.map((item) => ({
			...item,
			fecha_registro: item.fecha_registro || new Date().toISOString(),
		}))
	},

	async create(payload: ClientePayload): Promise<ClienteRecord> {
		const { data } = await api.post<ClienteRecord>("/cliente", payload)
		return data
	},

	async update(clienteId: number, payload: ClientePayload): Promise<ClienteRecord> {
		const { data } = await api.put<ClienteRecord>(`/cliente/${clienteId}`, payload)
		return data
	},

	async remove(clienteId: number): Promise<void> {
		await api.delete(`/cliente/${clienteId}`)
	},
}