import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const venta = await prisma.ventas.findUnique({
    where: { id_venta: Number(params.id) },
    include: {
      producto_venta: true,
      kardex: true,
    },
  });

  return venta
    ? NextResponse.json(venta)
    : NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizada = await prisma.ventas.update({
    where: { id_venta: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizada);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.ventas.delete({ where: { id_venta: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Venta eliminada' });
}