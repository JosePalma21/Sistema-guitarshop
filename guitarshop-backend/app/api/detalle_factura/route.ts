import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const detalles = await prisma.detalle_factura.findMany({
    include: {
      factura: true,
      producto: true,
    },
  });
  return NextResponse.json(detalles);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nuevo = await prisma.detalle_factura.create({ data: body });
  return NextResponse.json(nuevo);
}