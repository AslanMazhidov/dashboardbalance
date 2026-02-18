import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { count } = await prisma.dailyReport.deleteMany({
      where: { importBatchId: null },
    });

    return NextResponse.json({
      message: "Старые данные удалены",
      deletedReports: count,
    });
  } catch (error) {
    console.error("DELETE /api/import/batches/orphaned error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
