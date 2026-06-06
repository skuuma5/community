"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FolderPlus, FileText, Settings, AlertCircle } from "lucide-react";
import { createForum } from "@/lib/actions/forums";

export default function CreateForumPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createForum(formData);

      if (res.error) {
        setError(res.error);
      } else if (res.slug) {
        router.push(`/forums/${res.slug}`);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[650px] w-full mx-auto my-8 flex flex-col space-y-4 select-text">
      {/* Breadcrumb */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs text-slate-600 dark:text-slate-400">
        <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
          Board Index
        </Link>
        <span className="mx-2">&raquo;</span>
        <Link href="/forums" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
          Communities
        </Link>
        <span className="mx-2">&raquo;</span>
        <span>Start Community Forum</span>
      </div>

      {/* Main panel */}
      <div className="board-container rounded overflow-hidden">
        <div className="glossy-header text-xs py-1.5 flex items-center">
          <FolderPlus className="w-3.5 h-3.5 mr-1" /> Start a New Community / Sub-forum Board
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-[#1b2631] space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 pb-1.5 border-b border-dashed border-slate-200 dark:border-slate-800">
            Create your own community category board. As the owner, you can moderate post threads, configure custom rules, and guide discussions. Let&apos;s build the future (in 2010 style)!
          </div>

          {/* Forum Name */}
          <div className="flex flex-col space-y-1 text-xs">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
              <Settings className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Community Forum Name: <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full shadow-inner"
              placeholder="e.g. Dreamcast Collectors (3 to 25 chars)"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col space-y-1 text-xs">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Short Description: <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="description"
              className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full shadow-inner"
              placeholder="e.g. Dedicated space for all things Sega Dreamcast! Hacks, CD burns, and collections discussion."
              required
            />
          </div>

          {/* Rules */}
          <div className="flex flex-col space-y-1 text-xs">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Board Guidelines &amp; Rules:
            </label>
            <textarea
              name="rules"
              className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full h-20 shadow-inner"
              placeholder="Enter guidelines (e.g. 1. No flaming. 2. Post links to homebrews only. Keep it clean!)"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-center space-x-1.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-[#2a1b1b] border border-red-200 dark:border-red-950 p-2 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="retro-btn-green py-1.5 px-5 cursor-pointer"
            >
              {loading ? "Initializing..." : "Create Forum Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
