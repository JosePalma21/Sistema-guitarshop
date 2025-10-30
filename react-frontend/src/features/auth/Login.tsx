import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../../lib/apiClient";

const loginSchema = z.object({
    email: z.string().email("Correo inválido"),
    password: z.string().min(4, "Mínimo 4 caracteres"),
    });
type LoginInput = z.infer<typeof loginSchema>;

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    // Ajusta a tu endpoint real
    const res = await api.post("/auth/login", data);
    localStorage.setItem("auth_token", res.data.token ?? "demo");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
        <div>
          <label className="block text-sm">Correo</label>
          <input className="border rounded w-full p-2" {...register("email")} />
          {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm">Contraseña</label>
          <input type="password" className="border rounded w-full p-2" {...register("password")} />
          {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
        </div>
        <button disabled={isSubmitting} className="w-full p-2 rounded bg-black text-white">
          {isSubmitting ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
