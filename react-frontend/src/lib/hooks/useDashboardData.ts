import { useQuery } from "@tanstack/react-query"
import { api } from "../apiClient"

export interface LowStockProduct {
  id_producto: number
  nombre_producto: string
  cantidad_stock: number
}

export interface DashboardResponse {
  totalClientes: number
  totalProductos: number
  totalProveedores: number
  totalVentas: number
  totalCompras: number
  cuotasPendientes: number
  productosBajoStock: LowStockProduct[]
}

async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>("/dashboard")
  return data
}

// Encapsula la consulta del dashboard para reutilizar caché y políticas de refresco.
export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60, // 1 min
    refetchOnWindowFocus: false,
  })
}
