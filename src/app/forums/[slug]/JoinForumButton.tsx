"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { toggleForumMembership } from "@/lib/actions/forums";

interface JoinForumButtonProps {
  forumId: string;
  initialJoined: boolean;
}

export default function JoinForumButton({ forumId, initialJoined }: JoinForumButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await toggleForumMembership(forumId);
      if (res.success) {
        setJoined(res.joined || false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`cursor-pointer ${
        joined
          ? "retro-btn-gray py-1.5 px-4 font-bold flex items-center justify-center text-xs"
          : "retro-btn-green py-1.5 px-4 font-bold flex items-center justify-center text-xs"
      }`}
    >
      {joined ? (
        <>
          <UserCheck className="w-3.5 h-3.5 mr-1" /> Leave Community
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Join Community
        </>
      )}
    </button>
  );
}
