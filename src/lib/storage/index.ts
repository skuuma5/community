/**
 * Storage — single export point.
 *
 * Change the active adapter here to switch storage backends.
 * All consumers import `storage` from this file and never
 * reference a concrete adapter directly.
 *
 * To switch to Supabase:
 *   1. Create `src/lib/storage/supabase.ts` implementing StorageAdapter
 *   2. Replace the import and instantiation below
 *
 * To switch to S3:
 *   1. Create `src/lib/storage/s3.ts` implementing StorageAdapter
 *   2. Replace the import and instantiation below
 */

import { LocalStorageAdapter } from "./local";
// import { SupabaseStorageAdapter } from "./supabase";
// import { S3StorageAdapter } from "./s3";

export type { StorageAdapter } from "./storage";

export const storage = new LocalStorageAdapter();
// export const storage = new SupabaseStorageAdapter();
// export const storage = new S3StorageAdapter();
