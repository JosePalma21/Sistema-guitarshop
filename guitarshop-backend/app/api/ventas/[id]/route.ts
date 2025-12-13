// guitarshop-backend/app/api/ventas/[id]/route.ts
import { jsonCors, optionsCors } from "../../../../lib/cors";
import { hasAdminRole, verifyToken } from "../../../../lib/auth";
import {
  obtenerVentaPorId,
  actualizarVenta,
  anularVenta,
} from "../../../../lib/services/facturaService";

export async function OPTIONS() {
  return optionsCors();
}

function getIdFromUrl(req: Request): number | null {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const idString = parts[parts.length - 1];
  const id = Number(idString);
  return Number.isNaN(id) ? null : id;
}

// GET /api/ventas/:id
export async function GET(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors({ error: auth.message ?? "Token inválido" }, { status: 401 });
  }

  if (!hasAdminRole(auth)) {
    return jsonCors({ error: "Solo administradores pueden acceder a ventas" }, { status: 403 });
  }

  const id = getIdFromUrl(req);
  if (!id) {
    return jsonCors({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const venta = await obtenerVentaPorId(id);
    if (!venta) {
      return jsonCors({ error: "Venta no encontrada" }, { status: 404 });
    }

    return jsonCors(venta, { status: 200 });
  } catch (error) {
    console.error("Error GET /ventas/:id", error);
    return jsonCors({ error: "Error al obtener venta" }, { status: 500 });
  }
}

// PUT /api/ventas/:id (actualiza solo observaciones)
export async function PUT(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors({ error: auth.message ?? "Token inválido" }, { status: 401 });
  }

  if (!hasAdminRole(auth)) {
    return jsonCors({ error: "Solo administradores pueden actualizar ventas" }, { status: 403 });
  }

  const id = getIdFromUrl(req);
  if (!id) {
    return jsonCors({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const venta = await actualizarVenta(id, {
      observacion: body.observacion ?? null,
      id_usuario_modifi: auth.userId ?? null,
    });

    return jsonCors(venta, { status: 200 });
  } catch (error: any) {
    console.error("Error PUT /ventas/:id", error);

    if (error instanceof Error && error.message === "VENTA_NO_ENCONTRADA") {
      return jsonCors({ error: "Venta no encontrada" }, { status: 404 });
    }

    return jsonCors({ error: "Error al actualizar venta" }, { status: 500 });
  }
}

// DELETE /api/ventas/:id (anular)
export async function DELETE(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors({ error: auth.message ?? "Token inválido" }, { status: 401 });
  }

  if (!hasAdminRole(auth)) {
    return jsonCors({ error: "Solo administradores pueden anular ventas" }, { status: 403 });
  }

  const id = getIdFromUrl(req);
  if (!id) {
    return jsonCors({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const venta = await anularVenta(id, auth.userId ?? null);
    return jsonCors(venta, { status: 200 });
  } catch (error: any) {
    console.error("Error DELETE /ventas/:id", error);

    if (error instanceof Error) {
      if (error.message === "VENTA_NO_ENCONTRADA") {
        return jsonCors({ error: "Venta no encontrada" }, { status: 404 });
      }
      if (error.message === "VENTA_YA_ANULADA") {
        return jsonCors({ error: "La venta ya está anulada" }, { status: 409 });
      }
      if (error.message === "ESTADO_ANULADO_NO_CONFIGURADO") {
        return jsonCors(
          { error: "No existe el estado ANULADO en la base de datos" },
          { status: 500 }
        );
      }
    }

    return jsonCors({ error: "Error al anular venta" }, { status: 500 });
  }
}
