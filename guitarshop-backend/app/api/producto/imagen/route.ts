import { jsonCors, optionsCors } from "../../../../lib/cors";
import { verifyToken } from "../../../../lib/auth";
import { listProductImages, setProductImage } from "../../../../lib/services/productImageStore";

export async function OPTIONS() {
  return optionsCors();
}

export async function GET(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors({ error: auth.message ?? "Token inválido" }, { status: 401 });
  }

  try {
    const images = await listProductImages();
    return jsonCors(images, { status: 200 });
  } catch (error) {
    console.error("Error GET /producto/imagen:", error);
    return jsonCors({ error: "Error al obtener imágenes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = verifyToken(req);
  if (!auth.valid) {
    return jsonCors({ error: auth.message ?? "Token inválido" }, { status: 401 });
  }

  if (auth.rol !== "ADMIN") {
    return jsonCors({ error: "No tienes permisos para actualizar imágenes" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const id = Number(body?.id_producto);

    if (!Number.isInteger(id) || id <= 0) {
      return jsonCors({ error: "ID de producto inválido" }, { status: 400 });
    }

    const url = typeof body?.imagen_url === "string" ? body.imagen_url.trim() : "";
    const storedUrl = await setProductImage(id, url.length > 0 ? url : null);

    return jsonCors({ id_producto: id, imagen_url: storedUrl }, { status: 200 });
  } catch (error) {
    console.error("Error POST /producto/imagen:", error);
    return jsonCors({ error: "Error al actualizar imagen" }, { status: 500 });
  }
}
