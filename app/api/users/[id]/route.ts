import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdminSession } from "@/lib/auth-guard";

const VALID_ROLES = new Set(["ADMIN", "RECRUITER", "CANDIDATE"]);

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, department, role, password } = body;

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Prevent admin from demoting their own account
    if (id === auth.user.id && role !== undefined && role !== "ADMIN") {
      return NextResponse.json(
        { message: "Tidak dapat menurunkan role akun Admin yang sedang digunakan" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (role !== undefined) {
      if (!VALID_ROLES.has(role)) {
        return NextResponse.json({ message: "Invalid user role" }, { status: 400 });
      }
      updateData.role = role;
    }

    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { message: "Password must be at least 8 characters long" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT user error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    if (id === auth.user.id) {
      return NextResponse.json(
        { message: "Tidak dapat menghapus akun Admin yang sedang digunakan" },
        { status: 403 }
      );
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (userToDelete.email === "admin@example.com") {
      return NextResponse.json({ message: "Cannot delete the primary admin account" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
