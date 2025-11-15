import jwt from 'jsonwebtoken';

export function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return { valid: false, message: "Token no enviado" };
  }

  const token = authHeader.split(" ")[1]; // "Bearer token"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, message: "Token inválido o expirado" };
  }
}
