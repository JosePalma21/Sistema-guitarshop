import { useQuery } from "@tanstack/react-query"

import { proveedorClient } from "./proveedor.client"
import type { ProveedorRecord } from "./proveedor.types"

export const proveedoresQueryKey = ["proveedores"] as const

export const useProveedoresQuery = (enabled = true) => {
	return useQuery<ProveedorRecord[]>({
		queryKey: proveedoresQueryKey,
		enabled,
		staleTime: 30_000,
		queryFn: () => proveedorClient.list(),
	})
}