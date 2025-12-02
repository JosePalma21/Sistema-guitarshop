// guitarshop-backend/lib/services/creditoService.ts
import prisma from "../prisma";

// ==========================
// LISTAR TODOS LOS CRÉDITOS
// ==========================
export async function obtenerCreditos() {
  // Devolvemos todos los campos del crédito tal cual están en la BD
  const creditos = await prisma.credito.findMany({
    orderBy: { id_credito: "asc" },
  });

  return creditos;
}

// ==========================
// OBTENER CRÉDITO POR ID
// ==========================
export async function obtenerCreditoPorId(id_credito: number) {
  const credito = await prisma.credito.findUnique({
    where: { id_credito },
    // Si quieres incluir el cliente completo:
    // include: { cliente: true },
  });

  return credito; // puede ser null
}
