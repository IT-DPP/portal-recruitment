import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action") || "";
    const search = searchParams.get("search") || "";
    const limitParam = Number(searchParams.get("limit") || "150");
    const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 10), 500) : 150;

    const where: Record<string, any> = {};

    if (action) {
      where.action = action;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { actorEmail: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        { entityType: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
