// guitarshop-backend/app/api/credito/[id]/route.ts
import { jsonCors, optionsCors } from "../../../../lib/cors";
import { verifyToken } from "../../../../lib/auth";
import { obtenerCreditoPorId } from "../../../../lib/services/creditoService";

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

// GET /api/credito/:id
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
    const credito = await obtenerCreditoPorId(id);
    if (!credito) {
      return jsonCors(
        { error: "Crédito no encontrado" },
        { status: 404 }
      );
    }

    return jsonCors(credito, { status: 200 });
  } catch (err) {
    console.error("Error GET /credito/:id", err);
    return jsonCors(
      { error: "Error al obtener el crédito" },
      { status: 500 }
    );
  }
}
