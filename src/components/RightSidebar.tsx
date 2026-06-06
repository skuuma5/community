"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrendingUp, BarChart2, Radio, UserCheck } from "lucide-react";
import { getTrendingForums } from "@/lib/actions/forums";

interface ForumData {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
}

interface BoardStats {
  totalPosts: number;
  totalMembers: number;
  totalForums: number;
}

interface OnlineUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export default function RightSidebar() {
  const [trending, setTrending] = useState<ForumData[]>([]);
  const [stats, setStats] = useState<BoardStats>({ totalPosts: 0, totalMembers: 0, totalForums: 0 });
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSidebarData = async () => {
      setLoading(true);
      try {
        // Trending
        const trendRes = await getTrendingForums();
        setTrending(trendRes.forums || []);

        // Fetch stats and online list from standard routes
        const statsRes = await fetch("/api/board/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
          setOnlineUsers(statsData.onlineUsers || []);
        }
      } catch (error) {
        console.error("Failed to load right sidebar info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarData();
  }, []);

  return (
    <aside className="w-full md:w-56 flex flex-col space-y-4">
      {/* 1. Trending Communities */}
      <div className="board-container rounded">
        <div className="glossy-header text-xs py-1.5 flex items-center">
          <TrendingUp className="w-3.5 h-3.5 mr-1" /> Hot Communities
        </div>
        <div className="p-2 flex flex-col divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {loading ? (
            <span className="italic text-slate-500 py-2 text-center text-[10px]">Loading trends...</span>
          ) : trending.length > 0 ? (
            trending.map((forum, index) => (
              <div key={forum.id} className="py-1.5 flex items-center justify-between">
                <Link
                  href={`/forums/${forum.slug}`}
                  className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline truncate w-32"
                >
                  #{index + 1} {forum.name}
                </Link>
                <span className="text-[10px] text-slate-500 font-medium">
                  {forum.memberCount} members
                </span>
              </div>
            ))
          ) : (
            <span className="italic text-slate-500 py-2 text-center text-[10px]">No stats available.</span>
          )}
        </div>
      </div>

      {/* 2. Currently Online Users */}
      <div className="board-container rounded">
        <div className="glossy-header text-xs py-1.5 flex items-center">
          <Radio className="w-3.5 h-3.5 mr-1" /> Who is Online?
        </div>
        <div className="p-2 flex flex-col text-xs space-y-2">
          {loading ? (
            <span className="italic text-slate-500 py-1 text-[10px] text-center">Loading list...</span>
          ) : onlineUsers.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {onlineUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    title={`${user.username} - Active Online`}
                    className="hover:scale-105 transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatarUrl || "https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback"}
                      alt={user.username}
                      className="w-6 h-6 retro-avatar p-0.5"
                    />
                  </Link>
                ))}
              </div>
              <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 leading-tight">
                Total online: <strong className="text-slate-800 dark:text-slate-200">{onlineUsers.length}</strong> members active now.
              </div>
            </>
          ) : (
            <span className="italic text-slate-500 py-1 text-center text-[10px]">No members online.</span>
          )}
        </div>
      </div>

      {/* 3. Global Board Statistics */}
      <div className="board-container rounded">
        <div className="glossy-header text-xs py-1.5 flex items-center">
          <BarChart2 className="w-3.5 h-3.5 mr-1" /> Global Statistics
        </div>
        <div className="p-3 text-xs leading-relaxed space-y-1.5">
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
            <span className="text-slate-500 dark:text-slate-400">Total Posts:</span>
            <strong className="text-slate-800 dark:text-slate-200">{stats.totalPosts}</strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
            <span className="text-slate-500 dark:text-slate-400">Total Members:</span>
            <strong className="text-slate-800 dark:text-slate-200">{stats.totalMembers}</strong>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-slate-500 dark:text-slate-400">Communities:</span>
            <strong className="text-slate-800 dark:text-slate-200">{stats.totalForums}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}
