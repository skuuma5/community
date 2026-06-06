"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { toggleFollowUser } from "@/lib/actions/users";

interface FollowUserButtonProps {
  targetUserId: string;
  initialFollowed: boolean;
}

export default function FollowUserButton({ targetUserId, initialFollowed }: FollowUserButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [followed, setFollowed] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await toggleFollowUser(targetUserId);
      if (res.success) {
        setFollowed(res.followed || false);
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
        followed
          ? "retro-btn-gray py-1.5 px-3 font-bold flex items-center text-[11px]"
          : "retro-btn-green py-1.5 px-3 font-bold flex items-center text-[11px]"
      }`}
    >
      {followed ? (
        <>
          <UserCheck className="w-3.5 h-3.5 mr-1" /> Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Follow
        </>
      )}
    </button>
  );
}
