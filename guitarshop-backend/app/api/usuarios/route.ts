import { jsonCors, optionsCors } from "../../../lib/cors";
import { verifyToken } from "../../../lib/auth";
import {
  obtenerUsuarios,
  crearUsuario,
} from "../../../lib/services/usuarioService";

export async function OPTIONS() {
  return optionsCors();
}

// GET /api/usuarios
export async function GET(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors(
      { error: auth.message ?? "Token inválido" },
      { status: 401 }
    );
  }

  const usuarios = await obtenerUsuarios();
  return jsonCors(usuarios, { status: 200 });
}

// POST /api/usuarios
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

    const nuevo = await crearUsuario({
      nombre_completo: body.nombre_completo,
      correo: body.correo,
      telefono: body.telefono ?? null,     // ⬅⬅⬅ ahora sí lo mandamos
      direccion: body.direccion ?? null,   // opcional
      cedula: body.cedula ?? null,         // opcional
      rol: body.rol ?? "VENDEDOR",
      password: body.password,
      id_usuario_modifi: auth.userId ?? null,
    });

    return jsonCors(nuevo, { status: 201 });
  } catch (err) {
    console.error("Error POST /usuarios:", err);
    return jsonCors(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
