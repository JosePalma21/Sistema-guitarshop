import { jsonCors, optionsCors } from "../../../../lib/cors";
import { verifyToken } from "../../../../lib/auth";
import {
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
} from "../../../../lib/services/usuarioService";

export async function OPTIONS() {
  return optionsCors();
}

function getId(req: Request): number | null {
  const parts = new URL(req.url).pathname.split("/");
  const id = Number(parts[parts.length - 1]);
  return Number.isNaN(id) ? null : id;
}

export async function GET(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) return jsonCors({ error: auth.message }, { status: 401 });

  const id = getId(req);
  if (!id) return jsonCors({ error: "ID inválido" }, { status: 400 });

  const usuario = await obtenerUsuarioPorId(id);
  if (!usuario)
    return jsonCors({ error: "Usuario no encontrado" }, { status: 404 });

  return jsonCors(usuario);
}

export async function PUT(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) return jsonCors({ error: auth.message }, { status: 401 });

  const id = getId(req);
  if (!id) return jsonCors({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const actualizado = await actualizarUsuario(id, body);

  return jsonCors(actualizado);
}

export async function DELETE(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) return jsonCors({ error: auth.message }, { status: 401 });

  const id = getId(req);
  if (!id) return jsonCors({ error: "ID inválido" }, { status: 400 });

  const eliminado = await eliminarUsuario(id);

  return jsonCors(eliminado);
}
