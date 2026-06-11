"use client";

import { useSession } from "next-auth/react";
import { useState, useRef, useCallback } from "react";
import { Camera, X, Upload, Trash2, Loader2 } from "lucide-react";
import { resetAvatar } from "@/lib/actions/users";
import { useRouter } from "next/navigation";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  username: string;
}

/** Max file size (original): 15 MB (resized before upload) */
const MAX_SIZE = 15 * 1024 * 1024;

/** Accepted MIME types */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Crop and resize an image to a square via an offscreen canvas.
 * Returns a Blob in WebP format at the given target size.
 */
function cropAndResize(
  img: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropSize: number,
  targetSize: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));

    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, targetSize, targetSize);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image blob"));
      },
      "image/webp",
      0.85
    );
  });
}

export default function AvatarUpload({ currentAvatarUrl, username }: AvatarUploadProps) {
  const { update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [showModal, setShowModal] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Display avatar (use current or DiceBear fallback)
  const displayUrl = currentAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback`;

  /** Trigger file input */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  /** Handle file selection — validate, load preview, compute crop defaults */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be under 15 MB.");
      return;
    }

    // Load image for preview
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Default crop: largest centered square
      const minDim = Math.min(img.width, img.height);
      setCropOffset({
        x: Math.floor((img.width - minDim) / 2),
        y: Math.floor((img.height - minDim) / 2),
      });
      setCropSize(minDim);
      setOriginalImg(img);
      setPreviewSrc(url);
      setShowModal(true);
    };
    img.onerror = () => {
      setError("Failed to load image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;

    // Reset input so re-selecting the same file works
    e.target.value = "";
  }, []);

  /** Upload cropped image to server */
  const handleUpload = async () => {
    if (!originalImg) return;

    setUploading(true);
    setError(null);

    try {
      // Crop and compress to 400x400. Some mobile browsers may fall back
      // from WebP to PNG, so use the actual Blob MIME type when uploading.
      const blob = await cropAndResize(originalImg, cropOffset.x, cropOffset.y, cropSize, 400);
      const uploadType = ACCEPTED_TYPES.includes(blob.type) ? blob.type : "image/webp";
      const extension = uploadType === "image/png" ? "png" : uploadType === "image/jpeg" ? "jpg" : "webp";

      const formData = new FormData();
      formData.append("avatar", blob, `avatar.${extension}`);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({
        error: "The server returned an unreadable upload response.",
      }));

      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }

      // Refresh session so Navbar etc. get the new avatar
      await update({ user: { avatarUrl: data.avatarUrl } });

      // Close modal and refresh page data
      setShowModal(false);
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      setPreviewSrc(null);
      setOriginalImg(null);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof TypeError
          ? "Network error while uploading. Please check your connection and try again."
          : "An unexpected upload error occurred."
      );
    } finally {
      setUploading(false);
    }
  };

  /** Reset avatar to DiceBear default */
  const handleRemove = async () => {
    setRemoving(true);
    setError(null);

    try {
      const res = await resetAvatar();
      if (res.error) {
        setError(res.error);
        return;
      }

      await update({ user: { avatarUrl: res.avatarUrl } });
      router.refresh();
    } catch {
      setError("Failed to remove avatar.");
    } finally {
      setRemoving(false);
    }
  };

  /** Close the preview modal */
  const handleClose = () => {
    setShowModal(false);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setOriginalImg(null);
    setError(null);
  };

  return (
    <>
      {/* Avatar with upload overlay */}
      <div className="avatar-upload-wrapper" onClick={handleClick} title="Change profile picture">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayUrl}
          alt={username}
          className="w-16 h-16 bg-white dark:bg-[#1a2530] rounded border border-[#a1b7cd] p-1 shadow flex-shrink-0 cursor-pointer"
        />
        <div className="avatar-upload-overlay">
          <Camera className="w-5 h-5 text-white" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Remove avatar button (only if not default DiceBear) */}
      {currentAvatarUrl && !currentAvatarUrl.includes("dicebear.com") && (
        <button
          onClick={handleRemove}
          disabled={removing}
          className="retro-btn-gray py-1 px-2 text-[10px] flex items-center gap-1 mt-1 cursor-pointer"
          title="Remove custom avatar"
        >
          {removing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Reset
        </button>
      )}

      {/* Inline error (outside modal) */}
      {error && !showModal && (
        <div className="text-[10px] text-red-500 mt-1 max-w-[160px] leading-tight">{error}</div>
      )}

      {/* ===== Preview / Crop Modal ===== */}
      {showModal && previewSrc && (
        <div className="avatar-modal-backdrop" onClick={handleClose}>
          <div
            className="avatar-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="glossy-header text-xs flex items-center justify-between rounded-t">
              <span>Upload Profile Picture</span>
              <button
                onClick={handleClose}
                className="text-white hover:text-amber-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Area */}
            <div className="p-4 bg-white dark:bg-[#1b2631] space-y-3">
              <div className="avatar-crop-area">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="max-w-full max-h-[300px] mx-auto rounded border border-slate-300 dark:border-slate-700"
                />
              </div>

              <p className="text-[10px] text-slate-500 text-center">
                The image will be cropped to a square and resized to 400×400px.
              </p>

              {/* Error inside modal */}
              {error && (
                <div className="text-xs text-red-500 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                  {error}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleClose}
                  disabled={uploading}
                  className="retro-btn-gray py-1.5 px-3 text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="retro-btn-green py-1.5 px-3 text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Save Avatar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
