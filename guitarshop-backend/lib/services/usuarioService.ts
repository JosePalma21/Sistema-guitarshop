import prisma from "../prisma";
import bcrypt from "bcryptjs";

export interface UsuarioCreateInput {
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  cedula: string;
  contrasena: string;
  id_estado: number;
  id_usuario_modifi?: number | null;
}

export interface UsuarioUpdateInput {
  nombre?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  cedula?: string;
  id_estado?: number;
  id_usuario_modifi?: number | null;
}

// 🔹 listar todos (sin contraseña)
export async function getAllUsuarios() {
  return prisma.usuario.findMany({
    select: {
      id_usuario: true,
      nombre: true,
      correo: true,
      telefono: true,
      direccion: true,
      cedula: true,
      id_estado: true,
    },
  });
}

// 🔹 buscar por id (sin contraseña)
export async function getUsuarioById(id: number) {
  return prisma.usuario.findUnique({
    where: { id_usuario: id },
    select: {
      id_usuario: true,
      nombre: true,
      correo: true,
      telefono: true,
      direccion: true,
      cedula: true,
      id_estado: true,
    },
  });
}

// 🔹 crear (hasheando contraseña)
export async function createUsuario(data: UsuarioCreateInput) {
  const hashedPassword = await bcrypt.hash(data.contrasena, 10);

  return prisma.usuario.create({
    data: {
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      direccion: data.direccion,
      cedula: data.cedula,
      contrasena: hashedPassword,
      id_estado: data.id_estado,
      id_usuario_modifi: data.id_usuario_modifi ?? null,
    },
  });
}

// 🔹 actualizar
export async function updateUsuario(id: number, data: UsuarioUpdateInput) {
  return prisma.usuario.update({
    where: { id_usuario: id },
    data: {
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      direccion: data.direccion,
      cedula: data.cedula,
      id_estado: data.id_estado,
      id_usuario_modifi: data.id_usuario_modifi ?? null,
    },
  });
}

// 🔹 eliminar
export async function deleteUsuario(id: number) {
  return prisma.usuario.delete({
    where: { id_usuario: id },
  });
}
