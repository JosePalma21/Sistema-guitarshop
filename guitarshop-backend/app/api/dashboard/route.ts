// guitarshop-backend/app/api/dashboard/route.ts
import { jsonCors, optionsCors } from "../../../lib/cors";
import { verifyToken } from "../../../lib/auth";
import { obtenerDashboard } from "../../../lib/services/dashboardService";

export async function OPTIONS() {
  return optionsCors();
}

// GET /api/dashboard
export async function GET(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors(
      { error: auth.message ?? "Token inválido" },
      { status: 401 }
    );
  }

  try {
    const data = await obtenerDashboard();
    return jsonCors(data, { status: 200 });
  } catch (err) {
    console.error("Error GET /dashboard:", err);
    return jsonCors(
      { error: "Error al obtener información del dashboard" },
      { status: 500 }
    );
  }
}
