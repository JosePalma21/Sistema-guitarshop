// app/api/cuota/route.ts
import { jsonCors, optionsCors } from "../../../lib/cors";
import { verifyToken } from "../../../lib/auth";
import { obtenerTodasLasCuotas } from "../../../lib/services/cuotaService";

// Respuesta al preflight CORS
export async function OPTIONS() {
  return optionsCors();
}

// GET /api/cuota -> lista todas las cuotas
export async function GET(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors(
      { error: auth.message ?? "Token inválido" },
      { status: 401 }
    );
  }

  try {
    const cuotas = await obtenerTodasLasCuotas();
    return jsonCors(cuotas, { status: 200 });
  } catch (err) {
    console.error("Error GET /cuota", err);
    return jsonCors(
      { error: "Error al obtener las cuotas" },
      { status: 500 }
    );
  }
}
