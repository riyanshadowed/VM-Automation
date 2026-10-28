import { NextResponse } from "next/server";
import { getLogs, clearAllLogs, getDashboardStats, getDatabaseStatus } from "@/lib/services/store";

export async function GET() {
  try {
    const logs = await getLogs(100);
    const stats = await getDashboardStats();
    const dbStatus = await getDatabaseStatus();

    return NextResponse.json({
      success: true,
      logs,
      stats,
      dbStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearAllLogs();
    return NextResponse.json({ success: true, message: "Logs cleared" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

