import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdminSession } from "@/lib/auth-guard";
import { recordAuditLog } from "@/lib/audit-log";

const VALID_ROLES = new Set(["ADMIN", "RECRUITER", "CANDIDATE"]);

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, department, role, password } = body;

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Prevent admin from demoting their own account
    if (id === auth.user.id && role !== undefined && role !== "ADMIN") {
      return NextResponse.json(
        { message: "Tidak dapat menurunkan role akun Admin yang sedang digunakan" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (department !== undefined) updateData.department = department ? String(department).trim() : null;

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        return NextResponse.json({ message: "Email tidak boleh kosong" }, { status: 400 });
      }
      if (normalizedEmail !== targetUser.email) {
        const duplicate = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (duplicate && duplicate.id !== id) {
          return NextResponse.json({ message: "Email sudah digunakan oleh akun lain" }, { status: 409 });
        }
        updateData.email = normalizedEmail;
      }
    }

    if (role !== undefined) {
      if (!VALID_ROLES.has(role)) {
        return NextResponse.json({ message: "Invalid user role" }, { status: 400 });
      }
      updateData.role = role;
    }

    let passwordReset = false;
    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { message: "Password minimal harus 8 karakter" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 12);
      passwordReset = true;
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

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: passwordReset ? "USER_PASSWORD_RESET" : "USER_UPDATED",
      entityType: "User",
      entityId: updatedUser.id,
      metadata: {
        targetEmail: updatedUser.email,
        targetName: updatedUser.name,
        targetRole: updatedUser.role,
        department: updatedUser.department,
        passwordChanged: passwordReset,
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

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "USER_DELETED",
      entityType: "User",
      entityId: id,
      metadata: {
        deletedEmail: userToDelete.email,
        deletedName: userToDelete.name,
        deletedRole: userToDelete.role,
      },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
