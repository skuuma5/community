import db from "@/lib/db";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Folder, ArrowRight, FolderPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ForumsPage() {
  const forums = await db.forum.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: {
          username: true,
        },
      },
    },
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
          <span>Community Forums Directory</span>
        </div>
        <Link href="/forums/create" className="text-[#105289] dark:text-[#4a90e2] font-bold flex items-center hover:underline">
          <FolderPlus className="w-3.5 h-3.5 mr-1 text-green-600" /> Start a Forum
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Left Col */}
        <LeftSidebar />

        {/* Center Col: Communities Table List */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="board-container rounded overflow-hidden">
            {/* Header banner */}
            <div className="glossy-header text-xs py-1.5 flex items-center">
              <Folder className="w-3.5 h-3.5 mr-1" /> Board Index Categories &amp; Communities
            </div>

            {/* phpBB styled Table header */}
            <div className="glossy-header-sub hidden sm:grid grid-cols-12 gap-2 text-xs text-[#105289] border-b border-slate-200 dark:border-slate-800">
              <div className="col-span-6 font-bold">Forum Community Name</div>
              <div className="col-span-2 text-center font-bold">Members</div>
              <div className="col-span-2 text-center font-bold">Posts</div>
              <div className="col-span-2 text-right font-bold">Navigate</div>
            </div>

            {/* List Rows */}
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
              {forums.length > 0 ? (
                forums.map((forum) => (
                  <div
                    key={forum.id}
                    className="forum-row grid grid-cols-1 sm:grid-cols-12 items-center gap-2 p-3 text-xs"
                  >
                    {/* Main details col */}
                    <div className="col-span-6 flex items-start space-x-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={forum.logoUrl || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"}
                        alt={forum.name}
                        className="w-10 h-10 bg-white dark:bg-[#1a2530] rounded border border-slate-300 dark:border-slate-700 p-0.5 shadow-sm flex-shrink-0"
                      />
                      <div className="space-y-0.5">
                        <Link
                          href={`/forums/${forum.slug}`}
                          className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline text-sm"
                        >
                          {forum.name}
                        </Link>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                          {forum.description}
                        </p>
                        <div className="text-[9px] text-slate-400">
                          Moderator: <strong className="text-slate-500">{forum.owner.username}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Member stats */}
                    <div className="col-span-2 text-center font-bold text-slate-700 dark:text-slate-300 hidden sm:block">
                      {forum.memberCount}
                    </div>

                    {/* Post stats */}
                    <div className="col-span-2 text-center font-bold text-slate-700 dark:text-slate-300 hidden sm:block">
                      {forum.postCount}
                    </div>

                    {/* Nav button */}
                    <div className="col-span-2 text-right flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0 border-t sm:border-t-0 border-dashed border-slate-200 dark:border-slate-800 pt-2 sm:pt-0">
                      {/* Mobile stats label fallback */}
                      <div className="sm:hidden text-[10px] text-slate-400">
                        Members: <strong>{forum.memberCount}</strong> &bull; Posts: <strong>{forum.postCount}</strong>
                      </div>
                      
                      <Link
                        href={`/forums/${forum.slug}`}
                        className="retro-btn text-[10px] py-1 px-2.5 flex items-center"
                      >
                        Enter Board <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No community categories created yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col */}
        <RightSidebar />
      </div>

      <Footer />
    </div>
  );
}
