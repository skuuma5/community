import db from "@/lib/db";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";
import { User, Award, Calendar, Users, FileText, Bookmark, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FollowUserButton from "./FollowUserButton";
import ProfileTabs from "./ProfileTabs";
import AvatarUpload from "./AvatarUpload";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  // Fetch target user profile details
  const profileUser = await db.user.findUnique({
    where: { username },
    include: {
      posts: {
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
          likes: { select: { userId: true } },
          bookmarks: { select: { userId: true } },
        },
      },
      bookmarks: {
        include: {
          post: {
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
          },
        },
      },
      followers: {
        select: {
          followerId: true,
        },
      },
      following: true,
    },
  });

  if (!profileUser) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#1b2631] rounded board-container max-w-lg mx-auto my-12 text-xs">
        <h3 className="font-bold text-red-600 text-sm mb-2">Member Profile Not Found</h3>
        <p className="text-slate-500 mb-4">No registered user matches the username requested.</p>
        <Link href="/" className="retro-btn">Return Index</Link>
      </div>
    );
  }

  const isSelf = session ? session.user.id === profileUser.id : false;
  const isFollowing = session
    ? profileUser.followers.some((f) => f.followerId === session.user.id)
    : false;

  const joinedDate = new Date(profileUser.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const postsWritten = profileUser.posts;
  const postsBookmarked = profileUser.bookmarks.map((bm) => bm.post);

  return (
    <div className="flex flex-col space-y-4">
      {/* Breadcrumb */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs flex justify-between items-center text-slate-600 dark:text-slate-400">
        <div>
          <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
            Board Index
          </Link>
          <span className="mx-2">&raquo;</span>
          <span>Member Profile</span>
          <span className="mx-2">&raquo;</span>
          <span>{profileUser.username}</span>
        </div>
        <Link href="/" className="text-slate-500 hover:underline flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-0.5" /> Back
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Left col */}
        <LeftSidebar />

        {/* Center: Profile layout */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4">
          
          {/* Header Card */}
          <div className="board-container rounded bg-white dark:bg-[#1b2631] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Profile Avatar — editable for self, static for others */}
              {isSelf ? (
                <div className="flex flex-col items-center">
                  <AvatarUpload
                    currentAvatarUrl={profileUser.avatarUrl}
                    username={profileUser.username}
                  />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileUser.avatarUrl || "https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback"}
                  alt={profileUser.username}
                  className="w-16 h-16 bg-white dark:bg-[#1a2530] rounded border border-[#a1b7cd] p-1 shadow flex-shrink-0"
                />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-[#105289] dark:text-[#4a90e2] leading-none">
                    {profileUser.username}
                  </h1>
                  <span className="retro-badge badge-online">Online</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic max-w-md">
                  &quot;{profileUser.bio || "This user hasn't written a signature bio."}&quot;
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-0.5" /> Joined {joinedDate}</span>
                  <span className="flex items-center"><Award className="w-3 h-3 mr-0.5 text-amber-500" /> Reputation: <strong className="text-amber-600 dark:text-amber-400 ml-0.5">{profileUser.reputation}</strong></span>
                </div>
              </div>
            </div>

            {/* Follow/DM button stack */}
            {!isSelf && (
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <FollowUserButton targetUserId={profileUser.id} initialFollowed={isFollowing} />
                <Link
                  href={`/messages?user=${profileUser.username}`}
                  className="retro-btn text-[11px] py-1.5 px-3"
                >
                  Send DM
                </Link>
              </div>
            )}
          </div>

          {/* Counts Dashboard grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center font-bold">
            <div className="board-container rounded bg-[#f4f8fb] dark:bg-[#1a2530] p-2.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Posts Written</span>
              <span className="text-lg text-slate-800 dark:text-slate-200">{postsWritten.length}</span>
            </div>
            <div className="board-container rounded bg-[#f4f8fb] dark:bg-[#1a2530] p-2.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Reputation</span>
              <span className="text-lg text-amber-600 dark:text-amber-400">{profileUser.reputation}</span>
            </div>
            <div className="board-container rounded bg-[#f4f8fb] dark:bg-[#1a2530] p-2.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Followers</span>
              <span className="text-lg text-slate-800 dark:text-slate-200">{profileUser.followers.length}</span>
            </div>
            <div className="board-container rounded bg-[#f4f8fb] dark:bg-[#1a2530] p-2.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Following</span>
              <span className="text-lg text-slate-800 dark:text-slate-200">{profileUser.following.length}</span>
            </div>
          </div>

          {/* User History Tabs panel */}
          <ProfileTabs
            postsWritten={postsWritten}
            postsBookmarked={postsBookmarked}
            username={profileUser.username}
          />
        </div>

        <RightSidebar />
      </div>

      <Footer />
    </div>
  );
}
