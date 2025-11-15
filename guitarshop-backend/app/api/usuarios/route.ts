import { jsonCors, optionsCors } from "../../../lib/cors";
import { verifyToken } from "../../../lib/auth";
import {
  getAllUsuarios,
  createUsuario,
  type UsuarioCreateInput,
} from "../../../lib/services/usuarioService";

// Preflight CORS
export async function OPTIONS() {
  return optionsCors();
}

// GET /api/usuarios  -> lista de usuarios (PROTEGIDO)
export async function GET(request: Request) {
  const validation = verifyToken(request);

  if (!validation.valid) {
    return jsonCors({ error: validation.message }, { status: 401 });
  }

  const usuarios = await getAllUsuarios();
  return jsonCors(usuarios);
}

// POST /api/usuarios  -> crear nuevo usuario (también protegido)
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UsuarioCreateInput;

    if (!body.contrasena || !body.correo) {
      return jsonCors(
        { message: "Correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const nuevoUsuario = await createUsuario(body);

    return jsonCors(nuevoUsuario, { status: 201 });
  } catch (error) {
    console.error("Error POST /usuarios:", error);
    return jsonCors(
      { message: "Error al crear usuario", error: String(error) },
      { status: 500 }
    );
  }
}
