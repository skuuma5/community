"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ThumbsUp, Reply, User } from "lucide-react";
import { toggleLikeComment, createComment } from "@/lib/actions/comments";
import { useRouter } from "next/navigation";

interface CommentType {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  postId: string;
  userId: string;
  parentId: string | null;
  user: {
    username: string;
    avatarUrl: string | null;
    reputation: number;
    joinedAt: Date;
  };
  likes: { userId: string }[];
  replies?: CommentType[];
}

interface CommentNodeProps {
  comment: CommentType;
  depth: number;
}

export default function CommentNode({ comment, depth }: CommentNodeProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(comment.likeCount);
  const [isLiked, setIsLiked] = useState(
    session ? comment.likes.some((like) => like.userId === session.user.id) : false
  );
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  const handleLike = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoadingLike(true);
    try {
      const res = await toggleLikeComment(comment.id);
      if (res.success) {
        setIsLiked(res.liked || false);
        setLikesCount((prev) => (res.liked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", replyContent.trim());
      formData.append("postId", comment.postId);
      formData.append("parentId", comment.id);

      const res = await createComment(formData);
      if (res.success) {
        setReplyContent("");
        setShowReplyForm(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = new Date(comment.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const joinedDate = new Date(comment.user.joinedAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col space-y-2 select-text">
      {/* Comment Body Wrapper */}
      <div 
        className="flex items-stretch border border-slate-200 dark:border-slate-800 rounded overflow-hidden board-container"
        style={{ marginLeft: `${Math.min(depth * 24, 120)}px` }}
      >
        {/* Left Side: Traditional Forum User Info Stack */}
        <div className="w-28 sm:w-32 bg-[#f4f8fb] dark:bg-[#1a2530] border-r border-slate-200 dark:border-slate-800 p-2 text-center flex flex-col items-center space-y-1.5 flex-shrink-0">
          <Link href={`/profile/${comment.user.username}`} className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline text-[11px] truncate w-24">
            {comment.user.username}
          </Link>
          
          {/* Avatar */}
          {comment.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.user.avatarUrl}
              alt={comment.user.username}
              className="w-10 h-10 retro-avatar"
            />
          ) : (
            <div className="w-10 h-10 bg-slate-300 dark:bg-slate-700 flex items-center justify-center rounded border border-slate-400">
              <User className="w-5 h-5 text-slate-600" />
            </div>
          )}

          {/* Badges/Info */}
          <div className="flex flex-col space-y-0.5 text-[9px] text-slate-500 leading-tight">
            <div>
              <span className="retro-badge badge-member">Member</span>
            </div>
            <div>Joined: <strong>{joinedDate}</strong></div>
            <div>Karma: <strong className="text-amber-600 dark:text-amber-400">{comment.user.reputation}</strong></div>
            <div className="pt-0.5">
              <span className="online-dot" title="User is online"></span>
            </div>
          </div>
        </div>

        {/* Right Side: Message body & footer */}
        <div className="flex-1 flex flex-col p-3 bg-white dark:bg-[#1b2631]">
          {/* Header */}
          <div className="text-[10px] text-slate-400 border-b border-dashed border-slate-200 dark:border-slate-800 pb-1.5 mb-2 flex justify-between">
            <span>Posted: {formattedDate}</span>
            <span>#{comment.id.substring(0, 4).toUpperCase()}</span>
          </div>

          {/* Text content */}
          <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap flex-1 leading-relaxed">
            {comment.content}
          </p>

          {/* Action Links */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <div className="flex items-center space-x-3 text-slate-500">
              {/* Like */}
              <button
                onClick={handleLike}
                disabled={loadingLike}
                className={`flex items-center space-x-1 hover:text-[#105289] transition-colors cursor-pointer ${
                  isLiked ? "text-[#105289] font-bold" : ""
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Like ({likesCount})</span>
              </button>

              {/* Reply */}
              {session && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center space-x-1 hover:text-[#105289] transition-colors cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              )}
            </div>

            <div className="text-[9px] text-slate-400">
              Retrolink Engine
            </div>
          </div>
        </div>
      </div>

      {/* Sub-reply inline form */}
      {showReplyForm && (
        <form 
          onSubmit={handleReplySubmit}
          className="p-3 border border-slate-200 dark:border-slate-800 bg-[#e6eff6] dark:bg-[#223141] rounded space-y-2 board-container"
          style={{ marginLeft: `${Math.min((depth + 1) * 24, 144)}px` }}
        >
          <div className="text-[10px] font-bold text-[#105289] dark:text-[#4a90e2]">
            Post a quick reply to {comment.user.username}:
          </div>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Type your response here..."
            className="w-full text-xs p-2 bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] h-16 shadow-inner"
            required
          />
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="retro-btn-gray py-1 px-3 text-[10px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="retro-btn-green py-1 px-3 text-[10px] cursor-pointer"
            >
              {submitting ? "Posting..." : "Submit Reply"}
            </button>
          </div>
        </form>
      )}

      {/* Children replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
