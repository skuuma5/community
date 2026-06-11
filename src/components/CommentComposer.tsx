"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reply, AlertCircle, Loader2 } from "lucide-react";
import { createComment } from "@/lib/actions/comments";

interface CommentComposerProps {
  postId: string;
}

export default function CommentComposer({ postId }: CommentComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write a comment before posting.");
      return;
    }

    setError("");
    setLoading(false);

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("postId", postId);
      formData.append("content", content.trim());

      const res = await createComment(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setContent("");
        router.refresh();
      }
    } catch (err) {
      console.error("Comment composer error:", err);
      setError("An unexpected network error occurred while posting your comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="board-container rounded overflow-hidden">
      <div className="glossy-header text-xs py-1.5 flex items-center">
        <Reply className="w-3.5 h-3.5 mr-1" /> Post a Reply to this Thread
      </div>
      <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-[#1b2631] space-y-3">
        <div className="flex flex-col space-y-1 text-xs">
          <label className="font-bold text-slate-600 dark:text-slate-400">Write your reply message:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your message here... standard forum guidelines apply. Be polite."
            className="w-full text-xs p-2 bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] h-28 shadow-inner"
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-1.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-[#2a1b1b] border border-red-200 dark:border-red-950 p-2 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="retro-btn-green py-1.5 px-4 cursor-pointer flex items-center space-x-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Post Message</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
