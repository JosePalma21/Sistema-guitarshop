// guitarshop-backend/app/api/login/route.ts
import { NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { jsonCors } from "../../../lib/cors";

export async function POST(req: NextRequest) {
  try {
    const { correo, contrasena } = await req.json();

    if (!correo || !contrasena) {
      return jsonCors({ error: "Faltan credenciales" }, { status: 400 });
    }

    // Buscar usuario por correo
    const usuario = await prisma.usuario.findFirst({
      where: { correo: correo },
    });

    if (!usuario) {
      return jsonCors({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Validar contraseña (sin hash por ahora)
    if (usuario.contrasena !== contrasena) {
      return jsonCors({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
      process.env.JWT_SECRET || "clave_dev_segura",
      { expiresIn: "1h" }
    );

    return jsonCors({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
      token,
    });
  } catch (error) {
    console.error("Error en /api/login:", error);
    return jsonCors({ error: "Error interno" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return jsonCors({});
}
