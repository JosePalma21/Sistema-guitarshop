import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const detalle = await prisma.detalle_factura.findUnique({
    where: { id_det_fact: Number(params.id) },
    include: {
      factura: true,
      producto: true,
    },
  });

  return detalle
    ? NextResponse.json(detalle)
    : NextResponse.json({ error: 'Detalle no encontrado' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizado = await prisma.detalle_factura.update({
    where: { id_det_fact: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.detalle_factura.delete({ where: { id_det_fact: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Detalle eliminado' });
}