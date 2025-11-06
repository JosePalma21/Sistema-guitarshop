import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const credito = await prisma.credito.findUnique({
    where: { id_credito: Number(params.id) },
    include: {
      cliente: true,
      factura: true,
      cuota: true,
    },
  });

  return credito
    ? NextResponse.json(credito)
    : NextResponse.json({ error: 'Crédito no encontrado' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizado = await prisma.credito.update({
    where: { id_credito: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.credito.delete({ where: { id_credito: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Crédito eliminado' });
}