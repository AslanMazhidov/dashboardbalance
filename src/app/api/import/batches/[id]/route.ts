import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const batch = await prisma.importBatch.findUnique({ where: { id } });
    if (!batch) {
      return NextResponse.json(
        { error: "Импорт не найден" },
        { status: 404 }
      );
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const { count } = await tx.dailyReport.deleteMany({
        where: { importBatchId: id },
      });
      await tx.importBatch.delete({ where: { id } });
      return count;
    });

    return NextResponse.json({
      message: "Импорт удалён",
      deletedReports: deleted,
    });
  } catch (error) {
    console.error("DELETE /api/import/batches/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
