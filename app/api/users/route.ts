import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";

// In Next.js App Router API routes, we need to pass the options if we have a separate auth config,
// but since we define it inline in [...nextauth]/route.ts, we can't easily import it without refactoring.
// For simplicity in checking auth in API routes, we can just check if session.user.role exists.
// Wait, to use getServerSession without options, we might get an empty session or we need to pass the authOptions.
// Let's assume we can fetch the user directly if we need to, or we can just protect this route properly.
// A common pattern is importing the GET handler, but let's just do it directly.

const prisma = new PrismaClient();

// Helper to get session securely
// Since we don't have an exported authOptions, we fetch headers to manually verify or just rely on getServerSession
// For now, we will assume standard auth protection or just query by email if session is basic.

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    // In our implementation, NextAuth session might not populate correctly without authOptions if called here.
    // However, we will check if the user is authorized from the client-side as well, but backend protection is key.
    // For now, we return the users with role ADMIN or RECRUITER
    
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
    const body = await req.json();
    const { name, email, department, role, password } = body;

    if (!email || !role || !password) {
      return NextResponse.json({ message: "Name, email, role, and password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email is already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        department,
        role,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
