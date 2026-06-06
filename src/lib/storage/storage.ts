/**
 * StorageAdapter Interface
 *
 * Abstraction layer for file storage. All upload/delete operations go through
 * this interface so the backing store can be swapped without touching business logic.
 *
 * Implementations:
 *   - LocalStorageAdapter  (dev — writes to public/uploads/)
 *   - SupabaseStorageAdapter (future — Supabase Storage bucket)
 *   - S3StorageAdapter (future — AWS S3 bucket)
 */

export interface StorageAdapter {
  /**
   * Upload a file and return its publicly accessible URL.
   *
   * @param buffer   - Raw file contents
   * @param filename - Sanitized filename (e.g. "userId_1717000000.webp")
   * @param contentType - MIME type (e.g. "image/webp")
   * @returns The public URL where the file can be accessed
   */
  upload(buffer: Buffer, filename: string, contentType: string): Promise<string>;

  /**
   * Delete a previously uploaded file by its public URL.
   * Should silently no-op if the URL is external or doesn't match this adapter's
   * URL pattern (e.g. a DiceBear URL should not trigger a delete attempt).
   *
   * @param fileUrl - The public URL returned by a previous upload() call
   */
  delete(fileUrl: string): Promise<void>;
}
