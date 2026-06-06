import db from "@/lib/db";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";
import CreatePostBox from "@/components/CreatePostBox";
import { MessageSquare, RefreshCw } from "lucide-react";
import Link from "next/link";

// Force dynamic rendering to always query latest database updates
export const dynamic = "force-dynamic";

export default async function Home() {
  // Query all posts ordered chronologically
  const posts = await db.post.findMany({
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

  return (
    <div className="flex flex-col space-y-4">
      {/* Page Header / Breadcrumbs */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs flex justify-between items-center text-slate-600 dark:text-slate-400">
        <div>
          <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
            Board Index
          </Link>
          <span className="mx-2">&raquo;</span>
          <span>Latest Topics</span>
        </div>
        <div className="flex items-center space-x-1">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Last updated: just now</span>
        </div>
      </div>

      {/* 3-Column Workspace */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Left Col */}
        <LeftSidebar />

        {/* Center Col: Main feed */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread Composer */}
          <CreatePostBox />

          {/* Discussion feed panel */}
          <div className="board-container rounded overflow-hidden">
            {/* Header banner */}
            <div className="glossy-header text-xs py-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Active Discussions &amp; Topics
              </span>
              <span className="text-[10px] text-slate-200">
                Displaying <strong>{posts.length}</strong> active threads
              </span>
            </div>

            {/* List */}
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post as any} />
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  There are no topics in this board yet. Click &quot;Start Community&quot; or expand the composer to publish your first thread!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col */}
        <RightSidebar />
      </div>

      {/* phpBB Footer */}
      <Footer />
    </div>
  );
}
