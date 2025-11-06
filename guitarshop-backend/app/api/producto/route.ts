import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const productos = await prisma.producto.findMany({
    include: { proveedor: true },
  });
  return NextResponse.json(productos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nuevo = await prisma.producto.create({ data: body });
  return NextResponse.json(nuevo);
}