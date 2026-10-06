"use server";

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function uploadBase64File(base64Data: string, filename: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate input
    if (!base64Data) {
      return { success: false, error: "No data provided" };
    }

    // Determine file extension
    let ext = path.extname(filename);
    if (!ext) {
      const mimeMatch = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/);
      if (mimeMatch) {
        const mime = mimeMatch[1];
        if (mime === "application/pdf") ext = ".pdf";
        else if (mime === "image/png") ext = ".png";
        else if (mime === "image/jpeg") ext = ".jpg";
        else ext = ".bin";
      }
    }

    // Clean up base64 string
    const base64Content = base64Data.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    // Generate unique filename
    const uniqueFilename = `${uuidv4()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure directory exists
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
