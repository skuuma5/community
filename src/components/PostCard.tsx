"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { MessageSquare, ThumbsUp, Eye, Bookmark, ExternalLink, Image as ImageIcon, Flame } from "lucide-react";
import { toggleLikePost, toggleBookmarkPost } from "@/lib/actions/posts";
import { useRouter } from "next/navigation";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    type: string;
    mediaUrl: string | null;
    linkUrl: string | null;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    createdAt: Date;
    forum: {
      name: string;
      slug: string;
    };
    user: {
      username: string;
      avatarUrl: string | null;
    };
    likes: { userId: string }[];
    bookmarks: { userId: string }[];
  };
}

export default function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(
    session ? post.likes.some((like) => like.userId === session.user.id) : false
  );
  const [isBookmarked, setIsBookmarked] = useState(
    session ? post.bookmarks.some((bm) => bm.userId === session.user.id) : false
  );
  const [loading, setLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await toggleLikePost(post.id);
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

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await toggleBookmarkPost(post.id);
      if (res.success) {
        setIsBookmarked(res.bookmarked || false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getPostIcon = () => {
    switch (post.type) {
      case "LINK":
        return <ExternalLink className="w-4 h-4 text-emerald-500" />;
      case "IMAGE":
        return <ImageIcon className="w-4 h-4 text-indigo-500" />;
      case "DISCUSSION":
        return <Flame className="w-4 h-4 text-amber-500 animate-pulse" />;
      default:
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="forum-row flex flex-col sm:flex-row items-stretch p-3.5 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* 1. Icon & Main Content Col */}
      <div className="flex-1 flex items-start space-x-3">
        {/* Status Indicator Icon */}
        <div className="mt-1 bg-slate-100 dark:bg-[#1f2c39] border border-slate-300 dark:border-slate-700 p-2 rounded shadow-inner flex-shrink-0">
          {getPostIcon()}
        </div>

        {/* Title and details */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/forums/${post.forum.slug}/posts/${post.id}`}
              className="font-bold text-sm text-[#105289] dark:text-[#4a90e2] hover:underline leading-tight"
            >
              {post.title}
            </Link>
            {post.type === "LINK" && post.linkUrl && (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] bg-[#dbe8f5] dark:bg-slate-700 text-[#105289] dark:text-slate-200 px-1 rounded flex items-center hover:opacity-85"
              >
                Link <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            )}
          </div>
          
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Posted in{" "}
            <Link href={`/forums/${post.forum.slug}`} className="font-bold hover:underline text-slate-700 dark:text-slate-300">
              {post.forum.name}
            </Link>{" "}
            by{" "}
            <Link href={`/profile/${post.user.username}`} className="font-bold hover:underline text-[#105289] dark:text-[#4a90e2]">
              {post.user.username}
            </Link>{" "}
            &bull; {formattedDate}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-0.5">
            {post.content}
          </p>
        </div>
      </div>

      {/* 2. Stats Columns (vBulletin style views/replies box) */}
      <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end space-x-6 sm:space-x-8 text-center text-xs text-slate-500 border-t sm:border-t-0 border-dashed border-slate-200 dark:border-slate-800 pt-2 sm:pt-0">
        
        {/* Replies */}
        <div className="w-14">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {post.commentCount}
          </div>
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Replies</span>
        </div>

        {/* Likes */}
        <div className="w-12">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {likesCount}
          </div>
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Likes</span>
        </div>

        {/* Views */}
        <div className="w-12">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {post.viewCount}
          </div>
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Views</span>
        </div>

        {/* Action Panel */}
        <div className="flex items-center space-x-1 pl-2">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={loading}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              isLiked
                ? "bg-[#105289] text-white border-[#0e4471]"
                : "bg-white dark:bg-[#1a2530] text-slate-500 border-slate-300 dark:border-slate-700 hover:bg-[#e6eff6]"
            }`}
            title={isLiked ? "Unlike thread" : "Like thread"}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          
          {/* Bookmark button */}
          <button
            onClick={handleBookmark}
            disabled={loading}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              isBookmarked
                ? "bg-amber-500 text-white border-amber-600"
                : "bg-white dark:bg-[#1a2530] text-slate-500 border-slate-300 dark:border-slate-700 hover:bg-[#e6eff6]"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark thread"}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
