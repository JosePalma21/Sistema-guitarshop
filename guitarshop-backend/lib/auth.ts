import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "guitar_123";

export interface JwtPayload {
  id: number;
  correo: string;
  iat: number;
  exp: number;
}

export function verifyToken(req: Request): {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
} {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authHeader) {
    return { valid: false, error: "Token no enviado" };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    return {
      valid: true,
      payload: decoded,
    };
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return { valid: false, error: "Token expirado" };
    }

    return { valid: false, error: "Token inválido" };
  }
}
