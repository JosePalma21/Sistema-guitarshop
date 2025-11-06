import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const ventas = await prisma.ventas.findMany({
    include: {
      producto_venta: true,
      kardex: true,
    },
  });
  return NextResponse.json(ventas);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nueva = await prisma.ventas.create({ data: body });
  return NextResponse.json(nueva);
}