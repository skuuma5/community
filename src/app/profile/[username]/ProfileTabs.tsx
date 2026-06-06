"use client";

import { useState } from "react";
import PostCard from "@/components/PostCard";
import { FileText, Bookmark } from "lucide-react";

interface ProfileTabsProps {
  postsWritten: any[];
  postsBookmarked: any[];
  username: string;
}

export default function ProfileTabs({ postsWritten, postsBookmarked, username }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "bookmarks">("posts");

  return (
    <div className="board-container rounded overflow-hidden">
      {/* Glossy Headers/Tabs tabs */}
      <div className="bg-[#105289] glossy-header text-xs py-0 flex items-stretch">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center space-x-1 px-4 py-2 border-r border-[#0e4471] font-bold cursor-pointer transition-colors ${
            activeTab === "posts"
              ? "bg-white dark:bg-[#1b2631] text-[#105289] dark:text-[#4a90e2] shadow-sm"
              : "text-white hover:bg-[#337bb5]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Post History ({postsWritten.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`flex items-center space-x-1 px-4 py-2 border-r border-[#0e4471] font-bold cursor-pointer transition-colors ${
            activeTab === "bookmarks"
              ? "bg-white dark:bg-[#1b2631] text-[#105289] dark:text-[#4a90e2] shadow-sm"
              : "text-white hover:bg-[#337bb5]"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Bookmarks ({postsBookmarked.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        {activeTab === "posts" ? (
          postsWritten.length > 0 ? (
            postsWritten.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              {username} hasn&apos;t written any discussion topics yet.
            </div>
          )
        ) : (
          postsBookmarked.length > 0 ? (
            postsBookmarked.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No bookmarked threads. Click bookmark on any thread row to add it here.
            </div>
          )
        )}
      </div>
    </div>
  );
}
