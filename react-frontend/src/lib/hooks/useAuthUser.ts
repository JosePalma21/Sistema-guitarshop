import { useMemo } from "react";

export type AuthUser = {
  id_usuario: number;
  nombre_completo?: string;
  correo?: string;
  rol?: string;
};

export function useAuthUser() {
  const authUser = useMemo<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("auth_user");
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored) as AuthUser;
      return parsed;
    } catch (error) {
      console.warn("No se pudo parsear auth_user", error);
      return null;
    }
  }, []);

  const role = authUser?.rol?.trim().toUpperCase() ?? null;
  const isAdmin = role === "ADMIN" || role === "ADMINISTRADOR";

  return { authUser, role, isAdmin };
}
