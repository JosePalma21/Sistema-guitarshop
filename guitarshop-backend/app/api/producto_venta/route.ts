import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const relaciones = await prisma.producto_venta.findMany({
    include: { producto: true, ventas: true },
  });
  return NextResponse.json(relaciones);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nuevo = await prisma.producto_venta.create({ data: body });
  return NextResponse.json(nuevo);
}