import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const relaciones = await prisma.producto_compra.findMany({
    where: { id_producto: Number(params.id) },
    include: {
      producto: true,
      compra: true,
    },
  });

  return relaciones.length > 0
    ? NextResponse.json(relaciones)
    : NextResponse.json({ error: 'Relación no encontrada' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizado = await prisma.producto_compra.update({
    where: {
      id_producto_id_compra: {
        id_producto: body.id_producto,
        id_compra: body.id_compra,
      },
    },
    data: body,
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.producto_compra.deleteMany({
    where: { id_producto: Number(params.id) },
  });
  return NextResponse.json({ mensaje: 'Relación eliminada' });
}