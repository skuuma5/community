import db from "@/lib/db";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";
import { Search, Folder, User, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { logServerError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";

  let matchedPosts: any[] = [];
  let matchedForums: any[] = [];
  let matchedUsers: any[] = [];
  let loadError = false;

  if (query.trim()) {
    const q = query.trim();

    try {
      [matchedPosts, matchedForums, matchedUsers] = await Promise.all([
        // 1. Search posts
        db.post.findMany({
          where: {
            OR: [
              { title: { contains: q } },
              { content: { contains: q } },
            ],
          },
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
            likes: { select: { userId: true } },
            bookmarks: { select: { userId: true } },
          },
          orderBy: { createdAt: "desc" },
        }),

        // 2. Search forums
        db.forum.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
            ],
          },
          take: 10,
        }),

        // 3. Search users
        db.user.findMany({
          where: {
            username: { contains: q },
          },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputation: true,
          },
          take: 10,
        }),
      ]);
    } catch (error) {
      loadError = true;
      logServerError("SearchPage.results", error);
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Breadcrumb */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs flex justify-between items-center text-slate-600 dark:text-slate-400">
        <div>
          <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
            Board Index
          </Link>
          <span className="mx-2">&raquo;</span>
          <span>Search Engine Board</span>
        </div>
        <Link href="/" className="text-slate-500 hover:underline flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-0.5" /> Back Index
        </Link>
      </div>

      {/* 3-Column workspace */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        <LeftSidebar />

        {/* Center: Search Results */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4">
          
          {/* Summary Box */}
          <div className="board-container rounded bg-white dark:bg-[#1b2631] p-4 text-xs space-y-3">
            <h2 className="font-bold text-sm text-[#105289] dark:text-[#4a90e2] flex items-center mb-1.5">
              <Search className="w-4 h-4 mr-1 text-[#105289]" /> Retrolink Search Engine
            </h2>
            <form action="/search" method="GET" className="flex items-center">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search forums, posts, users..."
                className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 text-xs px-2.5 py-1.5 rounded-l border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] flex-1 shadow-inner"
              />
              <button
                type="submit"
                className="retro-btn py-1.5 px-4 rounded-r rounded-l-none"
              >
                Search
              </button>
            </form>
            {query && (
              <p className="text-slate-500 text-[11px] pt-1">
                Your search for &quot;<strong className="text-slate-800 dark:text-slate-200 font-mono">{query}</strong>&quot; returned the following matched categories, posts, and registered users.
              </p>
            )}
          </div>

          {/* 1. Matched Forums */}
          {matchedForums.length > 0 && (
            <div className="board-container rounded overflow-hidden">
              <div className="glossy-header text-xs py-1.5 flex items-center">
                <Folder className="w-3.5 h-3.5 mr-1" /> Matched Communities ({matchedForums.length})
              </div>
              <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
                {matchedForums.map((f) => (
                  <div key={f.id} className="forum-row p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.logoUrl || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"}
                        alt={f.name}
                        className="w-8 h-8 rounded border border-slate-300 bg-white p-0.5 flex-shrink-0"
                      />
                      <div>
                        <Link href={`/forums/${f.slug}`} className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
                          {f.name}
                        </Link>
                        <p className="text-slate-500 text-[10px] mt-0.5 line-clamp-1">{f.description}</p>
                      </div>
                    </div>
                    <Link href={`/forums/${f.slug}`} className="retro-btn text-[10px] py-1 px-2.5">
                      View Board
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Matched Users */}
          {matchedUsers.length > 0 && (
            <div className="board-container rounded overflow-hidden">
              <div className="glossy-header text-xs py-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1" /> Matched Board Members ({matchedUsers.length})
              </div>
              <div className="p-2.5 bg-white dark:bg-[#1b2631] flex flex-wrap gap-2.5">
                {matchedUsers.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    className="flex items-center space-x-2 p-1.5 rounded border border-slate-300 dark:border-slate-800 hover:bg-[#e6eff6] dark:hover:bg-[#223141] text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.avatarUrl || "https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback"}
                      alt={u.username}
                      className="w-6 h-6 rounded bg-slate-100 p-0.5 border border-slate-300"
                    />
                    <div>
                      <span className="block truncate max-w-28 text-[11px]">{u.username}</span>
                      <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold block leading-none">Karma: {u.reputation}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 3. Matched Posts */}
          <div className="board-container rounded overflow-hidden">
            <div className="glossy-header text-xs py-1.5 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Matched Discussion Threads ({matchedPosts.length})
            </div>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
              {matchedPosts.length > 0 ? (
                matchedPosts.map((post) => (
                  <PostCard key={post.id} post={post as any} />
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  {loadError
                    ? "Search results could not be loaded right now. Please refresh in a moment."
                    : "No post threads matched your search query. Try another keyword."}
                </div>
              )}
            </div>
          </div>

        </div>

        <RightSidebar />
      </div>

      <Footer />
    </div>
  );
}
