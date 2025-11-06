import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const cliente = await prisma.cliente.findUnique({
    where: { id_cliente: Number(params.id) },
  });

  return cliente
    ? NextResponse.json(cliente)
    : NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizado = await prisma.cliente.update({
    where: { id_cliente: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.cliente.delete({ where: { id_cliente: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Cliente eliminado' });
}