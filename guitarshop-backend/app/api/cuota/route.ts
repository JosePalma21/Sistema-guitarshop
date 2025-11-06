import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const cuotas = await prisma.cuota.findMany({
    include: { credito: true },
  });
  return NextResponse.json(cuotas);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nueva = await prisma.cuota.create({ data: body });
  return NextResponse.json(nueva);
}