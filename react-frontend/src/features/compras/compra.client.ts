import { api } from "../../lib/apiClient"
import type { CompraPayload, CompraRecord } from "./compra.types"

export const compraClient = {
	async getAll(): Promise<CompraRecord[]> {
		const response = await api.get("/compra")
		return response.data
	},

	async getById(id: number): Promise<CompraRecord> {
		const response = await api.get(`/compra/${id}`)
		return response.data
	},

	async create(payload: CompraPayload): Promise<CompraRecord> {
		const response = await api.post("/compra", payload)
		return response.data
	},

	async update(id: number, payload: CompraPayload): Promise<CompraRecord> {
		const response = await api.put(`/compra/${id}`, payload)
		return response.data
	},

	async remove(id: number): Promise<void> {
		await api.delete(`/compra/${id}`)
	},
}