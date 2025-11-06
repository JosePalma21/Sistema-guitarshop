// guitarshop-backend/lib/cors.ts
import { NextResponse } from "next/server";

export function jsonCors(body: any, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set(
    "Access-Control-Allow-Origin",
    process.env.CORS_ORIGIN ?? "http://localhost:5173"
  );
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return res;
}
