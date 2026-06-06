import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { storage } from "@/lib/storage";

/** Allowed MIME types for avatar uploads */
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Maximum file size in bytes (2 MB) */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to upload an avatar." },
        { status: 401 }
      );
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    // 3. Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2 MB." },
        { status: 400 }
      );
    }

    // 5. Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Generate sanitized filename: {userId}_{timestamp}.{ext}
    const ext = file.type === "image/jpeg" ? "jpg" 
              : file.type === "image/png" ? "png" 
              : "webp";
    const sanitizedFilename = `${session.user.id}_${Date.now()}.${ext}`;

    // 7. Delete previous avatar via storage adapter (no-op for external URLs)
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    if (currentUser?.avatarUrl) {
      await storage.delete(currentUser.avatarUrl);
    }

    // 8. Upload new avatar via storage adapter
    const avatarUrl = await storage.upload(buffer, sanitizedFilename, file.type);

    // 9. Update database
    await db.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during upload." },
      { status: 500 }
    );
  }
}
