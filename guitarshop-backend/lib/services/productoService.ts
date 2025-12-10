// guitarshop-backend/lib/services/productoService.ts
import prisma from "../prisma";
import { Prisma } from "../../generated/prisma/client";

const productoSelect = {
  id_producto: true,
  codigo_producto: true,
  nombre_producto: true,
  descripcion: true,
  id_proveedor: true,
  precio_compra: true,
  precio_venta: true,
  cantidad_stock: true,
  stock_minimo: true,
  fecha_creacion: true,
  id_estado: true,
} as const;

// ==========================
// LISTAR PRODUCTOS
// ==========================
export async function listarProductos() {
  const productos = await prisma.producto.findMany({
    where: { id_estado: 1 }, // solo activos (cámbialo si quieres ver todos)
    select: {
      ...productoSelect,
      proveedor: {
        select: {
          id_proveedor: true,
          nombre_proveedor: true,
        },
      },
    },
    orderBy: { id_producto: "asc" },
  });

  return productos;
}

// ==========================
// OBTENER PRODUCTO POR ID
// ==========================
export async function obtenerProductoPorId(id: number) {
  const producto = await prisma.producto.findUnique({
    where: { id_producto: id },
    select: {
      ...productoSelect,
      proveedor: {
        select: {
          id_proveedor: true,
          nombre_proveedor: true,
        },
      },
    },
  });

  return producto; // puede ser null
}

// ==========================
// CREAR PRODUCTO
// ==========================
export async function crearProducto(data: {
  codigo_producto: string;
  nombre_producto: string;
  descripcion?: string | null;
  id_proveedor?: number | null;
  precio_compra: number | string;
  precio_venta: number | string;
  cantidad_stock?: number;
  stock_minimo?: number;
  id_usuario_modifi?: number | null;
}) {
  if (!data.id_proveedor) {
    throw new Error("PROVEEDOR_REQUERIDO");
  }

  try {
    const producto = await prisma.producto.create({
      data: {
        codigo_producto: data.codigo_producto,
        nombre_producto: data.nombre_producto,
        descripcion: data.descripcion ?? null,
        id_proveedor: data.id_proveedor,
        precio_compra: data.precio_compra,
        precio_venta: data.precio_venta,
        cantidad_stock: data.cantidad_stock ?? 0,
        stock_minimo: data.stock_minimo ?? 0,
        id_estado: 1,
        id_usuario_modifi: data.id_usuario_modifi ?? null,
      },
      select: {
        ...productoSelect,
        proveedor: {
          select: {
            id_proveedor: true,
            nombre_proveedor: true,
          },
        },
      },
    });

    return producto;
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // código de producto duplicado
      throw new Error("PRODUCTO_DUPLICADO");
    }
    throw error;
  }
}

// ==========================
// ACTUALIZAR PRODUCTO
// ==========================
export async function actualizarProducto(
  id: number,
  data: {
    codigo_producto?: string;
    nombre_producto?: string;
    descripcion?: string | null;
    id_proveedor?: number | null;
    precio_compra?: number | string;
    precio_venta?: number | string;
    cantidad_stock?: number;
    stock_minimo?: number;
    id_usuario_modifi?: number | null;
  }
) {
  if (data.id_proveedor !== undefined && !data.id_proveedor) {
    throw new Error("PROVEEDOR_REQUERIDO");
  }

  const updateData: any = {};

  if (data.codigo_producto !== undefined)
    updateData.codigo_producto = data.codigo_producto;
  if (data.nombre_producto !== undefined)
    updateData.nombre_producto = data.nombre_producto;
  if (data.descripcion !== undefined)
    updateData.descripcion = data.descripcion;
  if (data.id_proveedor !== undefined)
    updateData.id_proveedor = data.id_proveedor;
  if (data.precio_compra !== undefined)
    updateData.precio_compra = data.precio_compra;
  if (data.precio_venta !== undefined)
    updateData.precio_venta = data.precio_venta;
  if (data.cantidad_stock !== undefined)
    updateData.cantidad_stock = data.cantidad_stock;
  if (data.stock_minimo !== undefined)
    updateData.stock_minimo = data.stock_minimo;
  if (data.id_usuario_modifi !== undefined)
    updateData.id_usuario_modifi = data.id_usuario_modifi;

  try {
    const producto = await prisma.producto.update({
      where: { id_producto: id },
      data: updateData,
      select: {
        ...productoSelect,
        proveedor: {
          select: {
            id_proveedor: true,
            nombre_proveedor: true,
          },
        },
      },
    });

    return producto;
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("PRODUCTO_DUPLICADO");
    }
    throw error;
  }
}

// ==========================
// ELIMINAR PRODUCTO
// (solo si no tiene relaciones)
// ==========================
export async function eliminarProducto(id: number) {
  // Verificar si el producto está usado en compras, facturas o kardex
  const [enCompras, enFacturas, enKardex] = await Promise.all([
    prisma.producto_compra.count({ where: { id_producto: id } }),
    prisma.detalle_factura.count({ where: { id_producto: id } }),
    prisma.kardex.count({ where: { id_producto: id } }),
  ]);

  if (enCompras > 0 || enFacturas > 0 || enKardex > 0) {
    throw new Error("PRODUCTO_CON_RELACIONES");
  }

  const producto = await prisma.producto.delete({
    where: { id_producto: id },
    select: productoSelect,
  });

  return producto;
}
