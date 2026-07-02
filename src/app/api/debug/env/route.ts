import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    jwtSecretSet: !!process.env.JWT_SECRET,
    jwtSecretLen: process.env.JWT_SECRET?.length ?? 0,
  })
}
