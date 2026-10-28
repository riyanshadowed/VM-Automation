import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "instagram-automation-dashboard",
    phase: 1,
  });
}
