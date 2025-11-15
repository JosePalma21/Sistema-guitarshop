import { jsonCors, optionsCors } from "../../../../lib/cors";
import { verifyToken } from "../../../../lib/auth";
import {
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
  type UsuarioUpdateInput,
} from "../../../../lib/services/usuarioService";

// ===============================
// OPTIONS -> CORS preflight
// ===============================
export async function OPTIONS() {
  return optionsCors();
}

// Función auxiliar para extraer ID de la URL
function getIdFromUrl(req: Request): number | null {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const idString = parts[parts.length - 1];
  const id = Number(idString);
  return Number.isNaN(id) ? null : id;
}

// ===============================
// GET /api/usuarios/:id  (PROTEGIDO)
// ===============================
export async function GET(req: Request) {
  const validation = verifyToken(req);
  if (!validation.valid) {
    return jsonCors({ error: validation.message }, { status: 401 });
  }

  const id = getIdFromUrl(req);
  if (id === null) {
    return jsonCors({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const usuario = await getUsuarioById(id);

    if (!usuario) {
      return jsonCors({ message: "Usuario no encontrado" }, { status: 404 });
    }

    return jsonCors(usuario);
  } catch (error) {
    console.error("Error GET /usuarios/[id]:", error);
    return jsonCors(
      { message: "Error interno", error: String(error) },
      { status: 500 }
    );
  }
}

// ===============================
// PUT /api/usuarios/:id  (PROTEGIDO)
// ===============================
export async function PUT(req: Request) {
  const validation = verifyToken(req);
  if (!validation.valid) {
    return jsonCors({ error: validation.message }, { status: 401 });
  }

  const id = getIdFromUrl(req);
  if (id === null) {
    return jsonCors({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const body = (await req.json()) as UsuarioUpdateInput;

    const usuarioActualizado = await updateUsuario(id, body);

    return jsonCors(usuarioActualizado);
  } catch (error) {
    console.error("Error PUT /usuarios/[id]:", error);
    return jsonCors(
      { message: "Error al actualizar usuario", error: String(error) },
      { status: 500 }
    );
  }
}

// ===============================
// DELETE /api/usuarios/:id  (PROTEGIDO)
// ===============================
export async function DELETE(req: Request) {
  const validation = verifyToken(req);
  if (!validation.valid) {
    return jsonCors({ error: validation.message }, { status: 401 });
  }

  const id = getIdFromUrl(req);
  if (id === null) {
    return jsonCors({ message: "ID inválido" }, { status: 400 });
  }

  try {
    await deleteUsuario(id);
    return jsonCors({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error DELETE /usuarios/[id]:", error);
    return jsonCors(
      { message: "Error al eliminar usuario", error: String(error) },
      { status: 500 }
    );
  }
}
