"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Home, Compass, MessageSquare, Bell, Award, Users, ChevronRight, PlusCircle, Search } from "lucide-react";
import db from "@/lib/db";

interface JoinedForum {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export default function LeftSidebar() {
  const { data: session } = useSession();
  const [joinedForums, setJoinedForums] = useState<JoinedForum[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      const fetchJoined = async () => {
        setLoading(true);
        try {
          // In Next.js App Router we fetch client side if needed or pass down,
          // Let's use a quick fetch call or Server Action mock. Since it's client-side,
          // we can create a simple route or just run a client-side fetch.
          // Let's use a quick API fetch `/api/user/forums` or query client side.
          // Wait, we can implement a fast route or fetch. Let's create an API route /api/user/forums later,
          // or we can make a lightweight fetch. Let's fetch it!
          const res = await fetch("/api/user/forums");
          if (res.ok) {
            const data = await res.json();
            setJoinedForums(data.forums || []);
          }
        } catch (error) {
          console.error("Failed to load user forums:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchJoined();
    } else {
      setJoinedForums([]);
    }
  }, [session]);

  return (
    <aside className="w-full md:w-56 flex flex-col space-y-4 order-last md:order-none">
      {/* 1. Retro User Panel (If logged in) */}
      {session ? (
        <div className="board-container rounded">
          <div className="glossy-header text-xs py-1.5 flex items-center">
            <Award className="w-3.5 h-3.5 mr-1" /> User Dashboard
          </div>
          <div className="p-3 flex flex-col items-center text-center space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.user.avatarUrl || "https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback"}
              alt={session.user.username}
              className="w-16 h-16 retro-avatar"
            />
            <div className="leading-tight">
              <Link href={`/profile/${session.user.username}`} className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline text-sm block">
                {session.user.username}
              </Link>
              <div className="mt-1">
                <span className="retro-badge badge-online">Online</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="w-full border-t border-slate-200 dark:border-slate-700 pt-2 grid grid-cols-2 gap-1 text-[11px]">
              <div className="text-left">
                <span className="text-slate-500 dark:text-slate-400">Reputation:</span>
              </div>
              <div className="text-right font-bold text-amber-600 dark:text-amber-400">
                {session.user.reputation}
              </div>
              <div className="text-left">
                <span className="text-slate-500 dark:text-slate-400">Role:</span>
              </div>
              <div className="text-right font-bold text-slate-700 dark:text-slate-300">
                Member
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="board-container rounded p-3 text-center space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Welcome, Guest! Log in to join communities, post threads, and direct message members.
          </p>
          <Link href="/login" className="retro-btn w-full text-center">
            Sign In Now
          </Link>
        </div>
      )}

      {/* 2. Main Navigation Panel */}
      <div className="board-container rounded">
        <div className="glossy-header text-xs py-1.5">Navigation</div>
        <nav className="flex flex-col text-xs font-bold divide-y divide-slate-200 dark:divide-slate-700">
          <Link href="/" className="flex items-center px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-[#e6eff6] dark:hover:bg-[#223141]">
            <Home className="w-4 h-4 mr-2 text-[#105289]" /> Board Index
          </Link>
          <Link href="/forums" className="flex items-center px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-[#e6eff6] dark:hover:bg-[#223141]">
            <Compass className="w-4 h-4 mr-2 text-[#105289]" /> All Communities
          </Link>
          <Link href="/search" className="flex items-center px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-[#e6eff6] dark:hover:bg-[#223141]">
            <Search className="w-4 h-4 mr-2 text-[#105289]" /> Search Board
          </Link>
          {session && (
            <>
              <Link href="/messages" className="flex items-center px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-[#e6eff6] dark:hover:bg-[#223141]">
                <MessageSquare className="w-4 h-4 mr-2 text-[#105289]" /> Private Inbox
              </Link>
              <Link href="/notifications" className="flex items-center px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-[#e6eff6] dark:hover:bg-[#223141]">
                <Bell className="w-4 h-4 mr-2 text-[#105289]" /> Notifications
              </Link>
              <Link href="/forums/create" className="flex items-center px-3 py-2 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-[#1a3821]">
                <PlusCircle className="w-4 h-4 mr-2 text-green-600" /> Start Community
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* 3. Joined Communities (If logged in) */}
      {session && (
        <div className="board-container rounded">
          <div className="glossy-header text-xs py-1.5 flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-3.5 h-3.5 mr-1" /> My Forums
            </span>
            <span className="text-[10px] bg-[#337bb5] px-1.5 rounded text-white font-normal">
              {joinedForums.length}
            </span>
          </div>
          <div className="p-1 flex flex-col text-xs space-y-1 max-h-56 overflow-y-auto">
            {loading ? (
              <span className="text-[10px] text-slate-500 p-2 italic text-center">Loading list...</span>
            ) : joinedForums.length > 0 ? (
              joinedForums.map((f) => (
                <Link
                  key={f.id}
                  href={`/forums/${f.slug}`}
                  className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#e6eff6] dark:hover:bg-[#223141] text-slate-700 dark:text-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.logoUrl || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"}
                    alt={f.name}
                    className="w-5 h-5 rounded bg-slate-100 p-0.5 border border-slate-300"
                  />
                  <span className="truncate font-semibold text-[11px]">{f.name}</span>
                </Link>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 p-2 italic text-center">
                You haven&apos;t joined any communities yet!
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
