import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const usuarios = await prisma.usuario.findMany();
  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const body = await request.json();

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombre: body.nombre,
      correo: body.correo,
      telefono: body.telefono,
      direccion: body.direccion,
      cedula: body.cedula,
      contrasena: body.contrasena,
      id_estado: body.id_estado,
      id_usuario_modifi: body.id_usuario_modifi ?? null,
    },
  });

  return NextResponse.json(nuevoUsuario, { status: 201 });
}