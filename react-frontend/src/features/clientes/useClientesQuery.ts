import { useQuery } from "@tanstack/react-query"

import { clienteClient } from "./cliente.client"
import type { ClienteRecord } from "./cliente.types"

export const clientesQueryKey = ["clientes"] as const

export const useClientesQuery = (enabled = true) => {
	return useQuery<ClienteRecord[]>({
		queryKey: clientesQueryKey,
		enabled,
		staleTime: 30_000,
		queryFn: () => clienteClient.list(),
	})
}