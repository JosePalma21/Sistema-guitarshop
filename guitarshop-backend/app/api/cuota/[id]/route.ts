import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const cuota = await prisma.cuota.findUnique({
    where: { id_cuota: params.id },
    include: { credito: true },
  });

  return cuota
    ? NextResponse.json(cuota)
    : NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const actualizada = await prisma.cuota.update({
    where: { id_cuota: params.id },
    data: body,
  });
  return NextResponse.json(actualizada);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.cuota.delete({ where: { id_cuota: params.id } });
  return NextResponse.json({ mensaje: 'Cuota eliminada' });
}