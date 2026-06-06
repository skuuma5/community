import fs from "fs/promises";
import path from "path";
import type { StorageAdapter } from "./storage";

/**
 * Local filesystem storage adapter.
 *
 * Stores files under `public/uploads/avatars/` so Next.js serves them as
 * static assets at `/uploads/avatars/{filename}`.
 *
 * This is intended for local development (e.g. Laragon). For production,
 * swap to SupabaseStorageAdapter or S3StorageAdapter in `./index.ts`.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

/** URL prefix that identifies files managed by this adapter */
const LOCAL_URL_PREFIX = "/uploads/avatars/";

export class LocalStorageAdapter implements StorageAdapter {
  /**
   * Ensure the upload directory exists. Called lazily on first upload.
   */
  private async ensureDir(): Promise<void> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }

  async upload(
    buffer: Buffer,
    filename: string,
    _contentType: string
  ): Promise<string> {
    await this.ensureDir();

    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filePath, buffer);

    // Return the public URL path (served by Next.js from /public)
    return `${LOCAL_URL_PREFIX}${filename}`;
  }

  async delete(fileUrl: string): Promise<void> {
    // Only attempt deletion for files managed by this adapter
    if (!fileUrl || !fileUrl.startsWith(LOCAL_URL_PREFIX)) {
      return; // External URL (DiceBear, S3, etc.) — skip silently
    }

    const filename = fileUrl.replace(LOCAL_URL_PREFIX, "");

    // Guard against path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return;
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      // File may have been manually deleted — that's fine
      if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Failed to delete avatar file:", err);
      }
    }
  }
}
