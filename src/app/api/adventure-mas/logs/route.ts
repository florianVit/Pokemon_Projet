/**
 * True MAS Adventure - Logs Route
 * Get system logs and statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { trueMASOrchestrator } from "@/lib/ai/true-mas";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const agent = searchParams.get("agent") || undefined;

    console.log(`📊 [API-MAS] Fetching logs (limit: ${limit})`);

    const logs = trueMASOrchestrator.getLogs({ limit, agent });
    const stats = trueMASOrchestrator.getStats();

    const response = {
      success: true,
      messageCount: logs.length,
      logs,
      stats,
      systemInfo: {
        mode: "True Multi-Agent System",
        architecture: "Decentralized Message Bus",
        components: [
          "Generalist Agent (Long Reasoning)",
          "4 Specialist Agents (Short Reasoning)",
          "Message Bus (Communication)",
        ],
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[MAS Logs] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch logs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
