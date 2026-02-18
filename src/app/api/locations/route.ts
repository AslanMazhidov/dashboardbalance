import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where: { isActive?: boolean } = {};
    if (active === "true") {
      where.isActive = true;
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("GET /api/locations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, address } = body;

    if (!name || !address) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: { name, address },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("POST /api/locations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
