import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const proveedores = await prisma.proveedor.findMany({
    include: { producto: true, compra: true },
  });
  return NextResponse.json(proveedores);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nuevo = await prisma.proveedor.create({ data: body });
  return NextResponse.json(nuevo);
}