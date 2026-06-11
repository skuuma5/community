import type { StorageAdapter } from "./storage";

const DEFAULT_BUCKET = "avatars";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

  if (!url || !key) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    key,
    bucket,
  };
}

function isSupabasePublicUrl(fileUrl: string) {
  const config = getSupabaseConfig();

  return Boolean(
    config &&
    fileUrl.startsWith(
      `${config.url}/storage/v1/object/public/${config.bucket}/`
    )
  );
}

export class SupabaseStorageAdapter implements StorageAdapter {
  async upload(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const config = getSupabaseConfig();

    if (!config) {
      throw new Error(
        "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }

    const objectPath = `avatars/${filename}`;
    const uploadUrl = `${config.url}/storage/v1/object/${config.bucket}/${objectPath}`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.key}`,
        apikey: config.key,
        "content-type": contentType,
        "cache-control": "3600",
        "x-upsert": "true",
      },
      body: new Blob([buffer], { type: contentType }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        `Supabase upload failed (${response.status}): ${message || response.statusText
        }`
      );
    }

    return `${config.url}/storage/v1/object/public/${config.bucket}/${objectPath}`;
  }

  async delete(fileUrl: string): Promise<void> {
    const config = getSupabaseConfig();

    if (!config || !isSupabasePublicUrl(fileUrl)) {
      return;
    }

    const prefix = `${config.url}/storage/v1/object/public/${config.bucket}/`;
    const objectPath = fileUrl.replace(prefix, "");
    const response = await fetch(
      `${config.url}/storage/v1/object/${config.bucket}/${objectPath}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${config.key}`,
          apikey: config.key,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const message = await response.text();
      throw new Error(
        `Supabase delete failed (${response.status}): ${message || response.statusText
        }`
      );
    }
  }
}
