import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdminSession } from "@/lib/auth-guard";

const VALID_ROLES = new Set(["ADMIN", "RECRUITER", "CANDIDATE"]);

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "RECRUITER"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        image: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { name, email, department, role, password } = body;

    if (!email || !role || !password) {
      return NextResponse.json(
        { message: "Name, email, role, and password are required" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.has(role)) {
      return NextResponse.json({ message: "Invalid user role" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email is already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name ? String(name).trim() : null,
        email: normalizedEmail,
        department: department ? String(department).trim() : null,
        role,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
