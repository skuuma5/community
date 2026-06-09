import db from "@/lib/db";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import CommentNode from "@/components/CommentNode";
import { incrementPostViews } from "@/lib/actions/posts";
import { createComment } from "@/lib/actions/comments";
import { MessageSquare, Flame, ImageIcon, ExternalLink, ShieldAlert, Reply, AlertCircle, Eye, ThumbsUp } from "lucide-react";
import Link from "next/link";
import PostActionsPanel from "./PostActionsPanel";
import { getCurrentUserId } from "@/lib/session";
import { logServerError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ slug: string; postId: string }>;
}

function buildCommentTree(comments: any[]) {
  const map: Record<string, any> = {};
  const roots: any[] = [];

  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });

  comments.forEach((c) => {
    const mapped = map[c.id];
    if (c.parentId === null) {
      roots.push(mapped);
    } else {
      const parent = map[c.parentId];
      if (parent) {
        parent.replies.push(mapped);
      }
    }
  });

  return roots;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, postId } = await params;
  const userId = await getCurrentUserId();

  // Query detailed post
  let post = null;
  try {
    post = await db.post.findUnique({
      where: { id: postId },
      include: {
        forum: true,
        user: true,
        likes: {
          select: { userId: true },
        },
        bookmarks: {
          select: { userId: true },
        },
      },
    });
  } catch (error) {
    logServerError("PostPage.post", error);
  }

  if (!post || post.forum.slug !== slug) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#1b2631] rounded board-container max-w-lg mx-auto my-12 text-xs">
        <h3 className="font-bold text-red-600 text-sm mb-2">Discussion Thread Not Found</h3>
        <p className="text-slate-500 mb-4">The discussion thread you are looking for has been moved or deleted.</p>
        <Link href="/" className="retro-btn">Return Index</Link>
      </div>
    );
  }

  // Increment view counts after confirming the thread exists. A failed view
  // update should never prevent reading the thread.
  try {
    await db.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
    post.viewCount += 1;
  } catch (error) {
    logServerError("PostPage.incrementView", error);
  }

  // Query all comments for the post
  let rawComments: any[] = [];
  let commentsLoadError = false;
  try {
    rawComments = await db.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            reputation: true,
            joinedAt: true,
          },
        },
        likes: {
          select: { userId: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    commentsLoadError = true;
    logServerError("PostPage.comments", error);
  }

  const commentTree = buildCommentTree(rawComments);

  const formattedDate = new Date(post.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const joinedDate = new Date(post.user.joinedAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Breadcrumb */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs flex justify-between items-center text-slate-600 dark:text-slate-400">
        <div>
          <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
            Board Index
          </Link>
          <span className="mx-2">&raquo;</span>
          <Link href="/forums" className="hover:underline">
            Communities
          </Link>
          <span className="mx-2">&raquo;</span>
          <Link href={`/forums/${post.forum.slug}`} className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
            {post.forum.name}
          </Link>
          <span className="mx-2">&raquo;</span>
          <span className="truncate">{post.title}</span>
        </div>
      </div>

      {/* 3-Column workspace */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        <LeftSidebar />

        {/* Center: Thread view & comments */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4">
          
          {/* Main Thread Post Container (Classic forum block) */}
          <div className="board-container rounded overflow-hidden">
            {/* Header banner */}
            <div className="glossy-header text-xs py-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> View topic - {post.title}
              </span>
              <span className="text-[10px] text-slate-200">
                Views: <strong>{post.viewCount}</strong>
              </span>
            </div>

            {/* Side-by-side post view */}
            <div className="flex items-stretch select-text">
              {/* Left Column: Author card stack */}
              <div className="w-28 sm:w-36 bg-[#f4f8fb] dark:bg-[#1a2530] border-r border-[#a1b7cd] dark:border-slate-800 p-3 text-center flex flex-col items-center space-y-2 flex-shrink-0">
                <Link href={`/profile/${post.user.username}`} className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline text-xs truncate w-24 sm:w-32 block">
                  {post.user.username}
                </Link>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.user.avatarUrl || ""}
                  alt={post.user.username}
                  className="w-16 h-16 retro-avatar"
                />
                
                <div className="flex flex-col space-y-0.5 text-[9px] text-slate-500 leading-tight">
                  <div>
                    <span className="retro-badge badge-admin">Admin</span>
                  </div>
                  <div>Joined: <strong>{joinedDate}</strong></div>
                  <div>Karma: <strong className="text-amber-600 dark:text-amber-400">{post.user.reputation}</strong></div>
                  <div className="pt-0.5">
                    <span className="online-dot" title="User is online"></span>
                  </div>
                </div>
              </div>

              {/* Right Column: Message Content & Layout */}
              <div className="flex-1 flex flex-col p-4 bg-white dark:bg-[#1b2631]">
                {/* Meta details */}
                <div className="text-[10px] text-slate-400 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2 mb-3 flex items-center justify-between">
                  <span>Posted: {formattedDate}</span>
                  <span className="flex items-center text-slate-500">
                    <Eye className="w-3 h-3 mr-0.5" /> {post.viewCount} views
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col space-y-4">
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {post.title}
                  </h2>
                  
                  {/* Share Link fallback box */}
                  {post.type === "LINK" && post.linkUrl && (
                    <div className="bg-[#e6eff6] dark:bg-slate-800 border border-[#a1b7cd] dark:border-slate-700 rounded p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <ExternalLink className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-slate-500">Shared Link:</span>
                        <a href={post.linkUrl} target="_blank" rel="noreferrer" className="text-[#105289] dark:text-[#4a90e2] hover:underline font-bold truncate">
                          {post.linkUrl}
                        </a>
                      </div>
                      <a href={post.linkUrl} target="_blank" rel="noreferrer" className="retro-btn text-[10px] py-1 px-2 flex-shrink-0">
                        Visit Site &raquo;
                      </a>
                    </div>
                  )}

                  {/* Share Image fallback box */}
                  {post.type === "IMAGE" && post.mediaUrl && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded p-2 bg-slate-50 dark:bg-[#121921] flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.mediaUrl}
                        alt={post.title}
                        className="max-h-96 object-contain rounded border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  )}

                  {/* Main text content */}
                  <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Like / Bookmark Action Controls Panel */}
                <PostActionsPanel
                  postId={post.id}
                  initialLikes={post.likeCount}
                  initialLiked={userId ? post.likes.some((l) => l.userId === userId) : false}
                  initialBookmarked={userId ? post.bookmarks.some((b) => b.userId === userId) : false}
                />
              </div>
            </div>
          </div>

          {/* Discussion comments tree */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#105289] dark:text-[#4a90e2] text-xs border-b border-[#a1b7cd] dark:border-slate-800 pb-1 mb-2">
              Replies to this discussion ({rawComments.length})
            </h3>
            
            {commentTree.length > 0 ? (
              <div className="space-y-3.5">
                {commentTree.map((comment) => (
                  <CommentNode key={comment.id} comment={comment} depth={0} />
                ))}
              </div>
            ) : (
              <div className="board-container rounded p-6 bg-white dark:bg-[#1b2631] text-center text-xs text-slate-500">
                {commentsLoadError
                  ? "Replies could not be loaded right now. Please refresh in a moment."
                  : "No replies have been posted to this thread yet. Be the first to express your thoughts below!"}
              </div>
            )}
          </div>

          {/* Add Reply Composer (Bottom page) */}
          {userId ? (
            <div className="board-container rounded overflow-hidden">
              <div className="glossy-header text-xs py-1.5 flex items-center">
                <Reply className="w-3.5 h-3.5 mr-1" /> Post a Reply to this Thread
              </div>
              <form action={createComment as unknown as (formData: FormData) => void} className="p-3 bg-white dark:bg-[#1b2631] space-y-3">
                <input type="hidden" name="postId" value={post.id} />
                
                <div className="flex flex-col space-y-1 text-xs">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Write your reply message:</label>
                  <textarea
                    name="content"
                    placeholder="Enter your message here... standard forum guidelines apply. Be polite."
                    className="w-full text-xs p-2 bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] h-28 shadow-inner"
                    required
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="retro-btn-green py-1.5 px-4 cursor-pointer"
                  >
                    Post Message
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="board-container rounded p-4 bg-amber-50 dark:bg-[#201c18] border-amber-300 dark:border-amber-950 text-center text-xs space-y-2">
              <p className="text-slate-600 dark:text-slate-300">
                You must be logged in to participate in the conversation.
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Link href="/login" className="retro-btn text-[11px] py-1 px-3">Log In</Link>
                <Link href="/register" className="retro-btn-green text-[11px] py-1 px-3">Register</Link>
              </div>
            </div>
          )}

        </div>

        <RightSidebar />
      </div>

      <Footer />
    </div>
  );
}
