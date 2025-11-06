import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const movimiento = await prisma.kardex.findUnique({
    where: { id_kardex: Number(params.id) },
    include: {
      producto: true,
      compra: true,
      ventas: true,
      factura: true,
    },
  });

  return movimiento
    ? NextResponse.json(movimiento)
    : NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizado = await prisma.kardex.update({
    where: { id_kardex: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.kardex.delete({ where: { id_kardex: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Movimiento eliminado' });
}