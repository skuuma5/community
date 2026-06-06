"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

interface OnlineUser {
  id: string;
  username: string;
}

export default function Footer() {
  const [onlineList, setOnlineList] = useState<OnlineUser[]>([]);
  const [counts, setCounts] = useState({ users: 0, posts: 0, forums: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const res = await fetch("/api/board/stats");
        if (res.ok) {
          const data = await res.json();
          setCounts({
            users: data.stats.totalMembers,
            posts: data.stats.totalPosts,
            forums: data.stats.totalForums,
          });
          setOnlineList(data.onlineUsers || []);
        }
      } catch (error) {
        console.error("Failed to load footer stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFooterData();
  }, []);

  return (
    <footer className="w-full mt-6 bg-[#f4f8fb] dark:bg-[#1a2530] border border-[#a1b7cd] dark:border-slate-800 rounded p-4 text-[11px] text-slate-600 dark:text-slate-400">
      
      {/* 1. Who is Online Panel (phpBB style) */}
      <div className="border-b border-[#a1b7cd] dark:border-slate-800 pb-3 mb-3">
        <h4 className="font-bold text-[#105289] dark:text-[#4a90e2] text-[12px] border-b border-dashed border-[#a1b7cd] dark:border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
          <span>Who is online</span>
          <span className="text-[10px] font-normal text-slate-500">Based on last active actions (15 minutes)</span>
        </h4>
        <p className="leading-relaxed">
          In total there are <strong>{onlineList.length}</strong> users online :: {onlineList.length} registered, 0 hidden and 0 guests. <br />
          Most users ever online was <strong>84</strong> on Tue May 25, 2010 8:44 pm.<br />
        </p>
        
        {/* Userlist tags */}
        {onlineList.length > 0 && (
          <div className="mt-2.5">
            <span className="text-slate-500 mr-1.5">Registered users:</span>
            <div className="inline flex-wrap gap-x-2">
              {onlineList.map((user, i) => {
                let colorClass = "text-slate-700 dark:text-slate-300";
                if (user.username === "ModeratorBob") {
                  colorClass = "text-red-600 dark:text-red-500 font-extrabold"; // Admin
                } else if (user.username === "CSS_Wizard_2010" || user.username === "MinecraftAlpha_Player") {
                  colorClass = "text-amber-600 dark:text-amber-500 font-bold"; // Mod
                }
                return (
                  <span key={user.id} className="inline">
                    <Link href={`/profile/${user.username}`} className={`${colorClass} hover:underline font-mono`}>
                      {user.username}
                    </Link>
                    {i < onlineList.length - 1 && <span className="text-slate-400 font-sans mx-1">,</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex items-center space-x-3 text-[10px]">
          <span className="text-slate-400">Legend:</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 bg-red-600 rounded-sm mr-1"></span> Administrators</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm mr-1"></span> Moderators</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 bg-[#5bc0de] rounded-sm mr-1"></span> Registered Users</span>
        </div>
      </div>

      {/* 2. Board Index Statistics */}
      <div className="border-b border-[#a1b7cd] dark:border-slate-800 pb-3 mb-3 leading-relaxed">
        <h4 className="font-bold text-[#105289] dark:text-[#4a90e2] text-[12px] border-b border-dashed border-[#a1b7cd] dark:border-slate-800 pb-1 mb-1.5">
          Statistics
        </h4>
        <p>
          Total posts <strong>{counts.posts}</strong> &bull; Total topics <strong>{counts.posts}</strong> &bull; Total communities <strong>{counts.forums}</strong> &bull; Total members <strong>{counts.users}</strong> &bull; Our newest member <strong><Link href="/profile/Sk8rBoi_92" className="text-[#105289] dark:text-[#4a90e2] hover:underline font-bold">Sk8rBoi_92</Link></strong>
        </p>
      </div>

      {/* 3. Credits & Disclaimer */}
      <div className="flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400">
        <div>
          Powered by <strong className="text-slate-500 dark:text-slate-400">Retrolink Social Forum v1.0.0</strong> &copy; 2010-2026.
        </div>
        <div className="mt-2 md:mt-0 flex items-center space-x-2">
          <span>All times are UTC+01:00</span>
          <span>&bull;</span>
          <Link href="/forums" className="hover:underline">Contact Admin</Link>
          <span>&bull;</span>
          <Link href="/forums" className="hover:underline">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}
