import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [batches, orphanedCount] = await Promise.all([
      prisma.importBatch.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          _count: { select: { reports: true } },
        },
      }),
      prisma.dailyReport.count({
        where: { importBatchId: null },
      }),
    ]);

    return NextResponse.json({ batches, orphanedCount });
  } catch (error) {
    console.error("GET /api/import/batches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
