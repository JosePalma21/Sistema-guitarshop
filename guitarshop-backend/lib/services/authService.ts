import prisma from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function loginUsuario(email: string, password: string) {
  const user = await prisma.usuario.findUnique({
    where: { correo: email },
  });

  if (!user) return null;

  const passwordOk = await bcrypt.compare(password, user.contrasena);
  if (!passwordOk) return null;

  const token = jwt.sign(
    {
      id: user.id_usuario,
      correo: user.correo,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "2h" }
  );

  return {
    token,
    usuario: {
      id: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
    },
  };
}
