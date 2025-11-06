import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const producto = await prisma.producto.findUnique({
    where: { id_producto: Number(params.id) },
    include: { proveedor: true },
  });

  return producto
    ? NextResponse.json(producto)
    : NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizado = await prisma.producto.update({
    where: { id_producto: Number(params.id) },
    data: body,
  });
  return NextResponse.json(actualizado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.producto.delete({ where: { id_producto: Number(params.id) } });
  return NextResponse.json({ mensaje: 'Producto eliminado' });
}