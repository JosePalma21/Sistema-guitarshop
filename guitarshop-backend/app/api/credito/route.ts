import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const creditos = await prisma.credito.findMany({
    include: {
      cliente: true,
      factura: true,
      cuota: true,
    },
  });
  return NextResponse.json(creditos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nuevo = await prisma.credito.create({ data: body });
  return NextResponse.json(nuevo);
}