// app/api/orders/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const orders = [
    { id: 1, userId: 1, productId: 2 },
    { id: 2, userId: 2, productId: 1 },
  ];
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newOrder = {
    id: Math.floor(Math.random() * 1000),
    userId: body.userId,
    productId: body.productId,
  };
  return NextResponse.json({ message: 'Orden creada', data: newOrder }, { status: 201 });
}