import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const movimientos = await prisma.kardex.findMany({
    include: {
      producto: true,
      compra: true,
      ventas: true,
      factura: true,
    },
  });
  return NextResponse.json(movimientos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nuevo = await prisma.kardex.create({ data: body });
  return NextResponse.json(nuevo);
}