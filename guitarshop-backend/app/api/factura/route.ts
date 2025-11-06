import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const facturas = await prisma.factura.findMany({
    include: {
      cliente: true,
      usuario: true,
      detalle_factura: true,
      credito: true,
    },
  });
  return NextResponse.json(facturas);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nueva = await prisma.factura.create({ data: body });
  return NextResponse.json(nueva);
}