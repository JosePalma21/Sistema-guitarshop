import { jsonCors, optionsCors } from "../../../lib/cors";
import { loginUsuario } from "../../../lib/services/authService";

type LoginBody = {
  email: string;
  password: string;
};

export async function OPTIONS() {
  return optionsCors();
}

export async function POST(request: Request) {
  try {
    const body: LoginBody = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonCors(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const result = await loginUsuario(email, password);

    if (!result) {
      return jsonCors(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    return jsonCors(
      {
        message: "Login correcto",
        token: result.token,
        usuario: result.usuario,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en /api/login:", error);
    return jsonCors(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
