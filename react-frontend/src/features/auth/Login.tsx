// src/features/auth/Login.tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

const loginSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(4, "Mínimo 4 caracteres"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await axios.post("http://localhost:3000/api/login", data);

      // Verificamos que el backend realmente haya enviado token
      if (res.data?.token) {
        localStorage.setItem("auth_token", res.data.token);
        console.log("Login exitoso:", res.data.usuario);
        window.location.href = "/";
      } else {
        alert("La API no devolvió un token válido.");
      }
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error.response?.data || error.message);
      alert("Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-semibold">Iniciar sesión</h2>

        <div>
          <label className="block text-sm">Correo</label>
          <input
            className="border rounded w-full p-2"
            {...register("correo")}
            placeholder="correo@ejemplo.com"
          />
          {errors.correo && (
            <p className="text-red-600 text-sm">{errors.correo.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm">Contraseña</label>
          <input
            type="password"
            className="border rounded w-full p-2"
            {...register("contrasena")}
            placeholder="••••••"
          />
          {errors.contrasena && (
            <p className="text-red-600 text-sm">{errors.contrasena.message}</p>
          )}
        </div>

        <button disabled={isSubmitting} className="w-full p-2 rounded bg-black text-white">
          {isSubmitting ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
