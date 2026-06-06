"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Bookmark } from "lucide-react";
import { toggleLikePost, toggleBookmarkPost } from "@/lib/actions/posts";

interface PostActionsPanelProps {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
}

export default function PostActionsPanel({
  postId,
  initialLikes,
  initialLiked,
  initialBookmarked,
}: PostActionsPanelProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await toggleLikePost(postId);
      if (res.success) {
        setIsLiked(res.liked || false);
        setLikesCount((prev) => (res.liked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await toggleBookmarkPost(postId);
      if (res.success) {
        setIsBookmarked(res.bookmarked || false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
      <div className="flex items-center space-x-3 text-slate-500">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center space-x-1 hover:text-[#105289] transition-colors cursor-pointer ${
            isLiked ? "text-[#105289] font-bold" : ""
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Like thread ({likesCount})</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          disabled={loading}
          className={`flex items-center space-x-1 hover:text-amber-500 transition-colors cursor-pointer ${
            isBookmarked ? "text-amber-600 font-bold" : ""
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{isBookmarked ? "Bookmarked" : "Bookmark thread"}</span>
        </button>
      </div>

      <div className="text-[10px] text-slate-400">
        All posts belong to their respective authors
      </div>
    </div>
  );
}
