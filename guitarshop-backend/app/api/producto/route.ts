// guitarshop-backend/app/api/productos/route.ts
import { jsonCors, optionsCors } from "../../../lib/cors";
import { verifyToken } from "../../../lib/auth";
import {
  listarProductos,
  crearProducto,
} from "../../../lib/services/productoService";

export async function OPTIONS() {
  return optionsCors();
}

// GET /api/productos
export async function GET(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors(
      { error: auth.message ?? "Token inválido" },
      { status: 401 }
    );
  }

  try {
    const productos = await listarProductos();
    return jsonCors(productos, { status: 200 });
  } catch (error) {
    console.error("Error GET /productos:", error);
    return jsonCors(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

// POST /api/productos
export async function POST(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors(
      { error: auth.message ?? "Token inválido" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const producto = await crearProducto({
      codigo_producto: body.codigo_producto,
      nombre_producto: body.nombre_producto,
      descripcion: body.descripcion ?? null,
      id_proveedor: body.id_proveedor ?? null,
      precio_compra: body.precio_compra,
      precio_venta: body.precio_venta,
      cantidad_stock: body.cantidad_stock ?? 0,
      stock_minimo: body.stock_minimo ?? 0,
      id_usuario_modifi: auth.userId ?? null,
    });

    return jsonCors(producto, { status: 201 });
  } catch (error: any) {
    console.error("Error POST /productos:", error);

    if (error instanceof Error && error.message === "PRODUCTO_DUPLICADO") {
      return jsonCors(
        { error: "El código de producto ya está registrado" },
        { status: 400 }
      );
    }

    return jsonCors(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
