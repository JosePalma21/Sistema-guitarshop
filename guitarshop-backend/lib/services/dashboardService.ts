// guitarshop-backend/lib/services/dashboardService.ts
import prisma from "../prisma";

export async function obtenerDashboard() {
  // Hacemos varias consultas en paralelo
  const [
    totalClientes,
    totalProductos,
    totalProveedores,
    totalVentas,
    totalCompras,
    cuotasPendientes,
    productosBajoStock,
  ] = await Promise.all([
    prisma.cliente.count(),
    prisma.producto.count(),
    prisma.proveedor.count(),
    prisma.factura.count(),
    prisma.compra.count(),
    prisma.cuota.count({
      where: { estado_cuota: "PENDIENTE" },
    }),
    prisma.producto.findMany({
      where: { cantidad_stock: { lt: 5 } }, // productos con stock menor a 5
      select: {
        id_producto: true,
        nombre_producto: true,
        cantidad_stock: true,
      },
      orderBy: { cantidad_stock: "asc" },
      take: 10,
    }),
  ]);

  return {
    totalClientes,
    totalProductos,
    totalProveedores,
    totalVentas,
    totalCompras,
    cuotasPendientes,
    productosBajoStock,
  };
}
