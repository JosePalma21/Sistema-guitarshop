import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const compras = await prisma.compra.findMany({
    include: {
      proveedor: true,
      usuario: true,
      producto_compra: true,
    },
  });
  return NextResponse.json(compras);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nueva = await prisma.compra.create({ data: body });
  return NextResponse.json(nueva);
}