import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const relacion = await prisma.producto_venta.findMany({
    where: { id_producto: Number(params.id) },
    include: { producto: true, ventas: true },
  });

  return relacion.length > 0
    ? NextResponse.json(relacion)
    : NextResponse.json({ error: 'Relación no encontrada' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizado = await prisma.producto_venta.update({
    where: {
      id_producto_id_venta: {
        id_producto: body.id_producto,
        id_venta: body.id_venta,
      },
    },
    data: body,
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.producto_venta.deleteMany({
    where: { id_producto: Number(params.id) },
  });
  return NextResponse.json({ mensaje: 'Relación eliminada' });
}