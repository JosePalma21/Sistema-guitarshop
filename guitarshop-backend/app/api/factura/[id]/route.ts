import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const factura = await prisma.factura.findUnique({
    where: { id_factura: Number(params.id) },
    include: {
      cliente: true,
      usuario: true,
      detalle_factura: true,
      credito: true,
    },
  });

  return factura
    ? NextResponse.json(factura)
    : NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizada = await prisma.factura.update({
    where: { id_factura: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizada);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.factura.delete({ where: { id_factura: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Factura eliminada' });
}