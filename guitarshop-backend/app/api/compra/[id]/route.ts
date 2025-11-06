import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const compra = await prisma.compra.findUnique({
    where: { id_compra: Number(params.id) },
    include: {
      proveedor: true,
      usuario: true,
      producto_compra: true,
    },
  });

  return compra
    ? NextResponse.json(compra)
    : NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizada = await prisma.compra.update({
    where: { id_compra: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizada);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.compra.delete({ where: { id_compra: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Compra eliminada' });
}