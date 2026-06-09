import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { storage } from "@/lib/storage";
import { getCurrentUserId } from "@/lib/session";
import { getErrorMessage, logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Allowed MIME types for avatar uploads */
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Maximum file size in bytes (2 MB) */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to upload an avatar." },
        { status: 401 }
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_FILE_SIZE + 1024 * 256) {
      return NextResponse.json(
        { error: "Upload is too large. Please choose an image under 2 MB." },
        { status: 413 }
      );
    }

    // 2. Parse multipart form data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      logServerError("avatar.formData", error);
      return NextResponse.json(
        {
          error:
            "The upload could not be read. Please retry from a stable connection.",
        },
        { status: 400 }
      );
    }

    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    // 3. Validate file type
    const contentType = file.type || "application/octet-stream";
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected image appears to be empty. Please choose another file." },
        { status: 400 }
      );
    }

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
    const ext = contentType === "image/jpeg" ? "jpg" 
              : contentType === "image/png" ? "png" 
              : "webp";
    const sanitizedFilename = `${userId}_${Date.now()}.${ext}`;

    // 7. Delete previous avatar via storage adapter (no-op for external URLs)
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (currentUser?.avatarUrl) {
      await storage.delete(currentUser.avatarUrl);
    }

    // 8. Upload new avatar via storage adapter
    const avatarUrl = await storage.upload(buffer, sanitizedFilename, contentType);

    // 9. Update database
    await db.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    logServerError("avatar.upload", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "An unexpected error occurred during upload.") },
      { status: 500 }
    );
  }
}
