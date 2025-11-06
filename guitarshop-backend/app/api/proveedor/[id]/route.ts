import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const proveedor = await prisma.proveedor.findUnique({
    where: { id_proveedor: Number(params.id) },
    include: { producto: true, compra: true },
  });

  return proveedor
    ? NextResponse.json(proveedor)
    : NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizado = await prisma.proveedor.update({
    where: { id_proveedor: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.proveedor.delete({ where: { id_proveedor: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Proveedor eliminado' });
}