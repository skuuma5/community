import db from "@/lib/db";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";
import CreatePostBox from "@/components/CreatePostBox";
import { Folder, Users, MessageSquare, ShieldAlert } from "lucide-react";
import Link from "next/link";
import JoinForumButton from "./JoinForumButton";
import { getCurrentUserId } from "@/lib/session";
import { logServerError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface ForumPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ForumPage({ params }: ForumPageProps) {
  const { slug } = await params;
  const userId = await getCurrentUserId();
  let posts: any[] = [];
  let postsLoadError = false;

  // Fetch Forum with memberships
  let forum = null;
  try {
    forum = await db.forum.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            username: true,
          },
        },
        members: {
          select: {
            userId: true,
          },
        },
      },
    });
  } catch (error) {
    logServerError("ForumPage.forum", error);
  }

  if (!forum) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#1b2631] rounded board-container max-w-lg mx-auto my-12 text-xs">
        <h3 className="font-bold text-red-600 text-sm mb-2">Category Board Not Found</h3>
        <p className="text-slate-500 mb-4">The sub-forum board slug you requested does not exist on our servers.</p>
        <Link href="/" className="retro-btn">Return Index</Link>
      </div>
    );
  }

  // Fetch posts under this forum
  try {
    posts = await db.post.findMany({
      where: { forumId: forum.id },
      orderBy: { createdAt: "desc" },
      include: {
        forum: {
          select: {
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        bookmarks: {
          select: {
            userId: true,
          },
        },
      },
    });
  } catch (error) {
    postsLoadError = true;
    logServerError("ForumPage.posts", error);
  }

  const isJoined = userId ? forum.members.some((m) => m.userId === userId) : false;

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
          <span>{forum.name}</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Owner: <strong className="text-slate-700 dark:text-slate-300">{forum.owner.username}</strong>
        </div>
      </div>

      {/* Community Banner Panel */}
      <div className="board-container rounded bg-white dark:bg-[#1b2631] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={forum.logoUrl || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"}
            alt={forum.name}
            className="w-14 h-14 bg-slate-50 dark:bg-[#1a2530] rounded border border-[#a1b7cd] p-1 shadow-sm flex-shrink-0"
          />
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[#105289] dark:text-[#4a90e2] leading-tight">
              {forum.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs">
              {forum.description}
            </p>
            <div className="flex items-center space-x-3 text-[10px] text-slate-500">
              <span className="flex items-center"><Users className="w-3 h-3 mr-0.5" /> <strong>{forum.memberCount}</strong> members</span>
              <span className="flex items-center"><MessageSquare className="w-3 h-3 mr-0.5" /> <strong>{forum.postCount}</strong> threads</span>
            </div>
          </div>
        </div>

        {/* Join button */}
        <JoinForumButton forumId={forum.id} initialJoined={isJoined} />
      </div>

      {/* Rules Banner (If set) */}
      {forum.rules && (
        <div className="board-container rounded bg-[#fff9e6] dark:bg-[#2c2317] border-[#f0ad4e] dark:border-amber-950 p-3 text-xs leading-relaxed flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-amber-800 dark:text-amber-400 block mb-0.5">Board Rules &amp; Guidelines:</strong>
            <p className="text-amber-950 dark:text-amber-200 text-[11px] whitespace-pre-wrap">{forum.rules}</p>
          </div>
        </div>
      )}

      {/* 3-Column layout */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Left col */}
        <LeftSidebar />

        {/* Center col: posts feed */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread composer pre-selected to this community */}
          <CreatePostBox
            currentForumId={forum.id}
            forumsList={[{ id: forum.id, name: forum.name, slug: forum.slug }]}
          />

          <div className="board-container rounded overflow-hidden">
            <div className="glossy-header text-xs py-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <Folder className="w-3.5 h-3.5 mr-1" /> Threads in &quot;{forum.name}&quot;
              </span>
              <span className="text-[10px] text-slate-200">
                Displaying <strong>{posts.length}</strong> threads
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post as any} />
                ))
              ) : (
                <div className="p-12 text-center text-xs text-slate-500">
                  {postsLoadError
                    ? "Threads could not be loaded right now. Please refresh in a moment."
                    : "There are no discussion threads in this sub-forum board yet. Click here or expand the composer box to start a new discussion!"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right col */}
        <RightSidebar />
      </div>

      <Footer />
    </div>
  );
}
