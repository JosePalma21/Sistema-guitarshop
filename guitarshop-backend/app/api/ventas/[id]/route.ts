// guitarshop-backend/app/api/ventas/[id]/route.ts
import { jsonCors, optionsCors } from "../../../../lib/cors";
import { verifyToken } from "../../../../lib/auth";
import { obtenerVentaPorId } from "../../../../lib/services/facturaService";

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
    return jsonCors(
      { error: auth.message ?? "Token inválido" },
      { status: 401 }
    );
  }

  const id = getIdFromUrl(req);
  if (!id) {
    return jsonCors({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const venta = await obtenerVentaPorId(id);
    if (!venta) {
      return jsonCors(
        { error: "Venta / factura no encontrada" },
        { status: 404 }
      );
    }

    return jsonCors(venta, { status: 200 });
  } catch (error) {
    console.error("Error GET /ventas/:id", error);
    return jsonCors(
      { error: "Error al obtener venta" },
      { status: 500 }
    );
  }
}
