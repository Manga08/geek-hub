import { NextRequest, NextResponse } from "next/server";
import { getServerLogs } from "@/lib/debug/server-log";
import { requireSessionUserId } from "@/lib/auth/request-context";
import { z } from "zod";

// =========================
// Query Schema
// =========================

const querySchema = z.object({
  limit: z.coerce.number().int().min(50).max(500).default(200),
});

// =========================
// GET /api/debug/server-logs
// =========================

export async function GET(request: NextRequest) {
  // Dev-only endpoint
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Require debug header or session
  const debugHeader = request.headers.get("x-gh-debug");

  if (debugHeader !== "1") {
    // Fallback: require authenticated session
    const result = await requireSessionUserId();
    if (!result.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    limit: searchParams.get("limit") ?? 200,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  const { limit } = parsed.data;

  // Get logs from buffer
  const logs = getServerLogs(limit);

  return NextResponse.json({
    ok: true,
    data: { logs },
  });
}
