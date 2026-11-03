"use server";

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { requireRole, MAX_UPLOAD_SIZE_BYTES } from "@/lib/auth-guard";

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
};

export async function uploadBase64File(
  base64Data: string,
  filename: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const auth = await requireRole(["ADMIN", "RECRUITER", "CANDIDATE"]);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    if (!base64Data || !filename) {
      return { success: false, error: "Data file tidak lengkap" };
    }

    const mimeMatch = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    const detectedMime = mimeMatch?.[1]?.toLowerCase() || "";
    const mappedExt = ALLOWED_MIME_TO_EXT[detectedMime];

    if (!mappedExt) {
      return {
        success: false,
        error: "Tipe file tidak diizinkan. Hanya PDF, PNG, atau JPG yang diperbolehkan.",
      };
    }

    // Clean up base64 string
    const base64Content = base64Data.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    if (buffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      return {
        success: false,
        error: "Ukuran file melebihi batas maksimal 5 MB.",
      };
    }

    // Generate unique filename with strictly validated extension
    const uniqueFilename = `${uuidv4()}${mappedExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);

    return { success: true, url: `/uploads/${uniqueFilename}` };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Gagal mengunggah file" };
  }
}
