import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "Sistem Predator Online, Bos!",
    time: new Date().toISOString(),
  });
}
