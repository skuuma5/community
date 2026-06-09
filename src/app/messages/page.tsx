import db from "@/lib/db";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";
import DirectMessages from "./DirectMessages";
import { getCurrentUserId } from "@/lib/session";
import { logServerError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface MessagesPageProps {
  searchParams: Promise<{ user?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const userId = await getCurrentUserId();
  const params = await searchParams;
  const initialUser = params.user || "";

  if (!userId) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#1b2631] rounded board-container max-w-lg mx-auto my-12 text-xs">
        <h3 className="font-bold text-red-600 text-sm mb-2">Authentication Required</h3>
        <p className="text-slate-500 mb-4">You must log in to access your private messages inbox folder.</p>
        <Link href="/login" className="retro-btn">Log In</Link>
      </div>
    );
  }

  // Fetch all DMs involving the current user
  let messages: any[] = [];
  try {
    messages = await db.privateMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    logServerError("MessagesPage.messages", error);
  }

  // Group messages by the opposite participant
  const threadsMap: Record<string, {
    user: { id: string; username: string; avatarUrl: string | null };
    messages: any[];
    unreadCount: number;
  }> = {};

  messages.forEach((m) => {
    const isSender = m.senderId === userId;
    const otherUser = isSender ? m.receiver : m.sender;

    if (!threadsMap[otherUser.username]) {
      threadsMap[otherUser.username] = {
        user: otherUser,
        messages: [],
        unreadCount: 0,
      };
    }

    threadsMap[otherUser.username].messages.push(m);
    if (!isSender && !m.isRead) {
      threadsMap[otherUser.username].unreadCount += 1;
    }
  });

  const threads = Object.values(threadsMap);

  return (
    <div className="flex flex-col space-y-4">
      {/* Breadcrumbs */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs flex justify-between items-center text-slate-600 dark:text-slate-400">
        <div>
          <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
            Board Index
          </Link>
          <span className="mx-2">&raquo;</span>
          <span>Private Messaging folders</span>
        </div>
        <Link href="/" className="text-slate-500 hover:underline flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-0.5" /> Back Index
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Left col */}
        <LeftSidebar />

        {/* Center DM Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="board-container rounded overflow-hidden">
            <div className="glossy-header text-xs py-1.5 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Inbox &amp; Private Folder System
            </div>
            
            <DirectMessages
              threads={threads as any}
              currentUserId={userId}
              initialUser={initialUser}
            />
          </div>
        </div>

        {/* Right col */}
        <RightSidebar />
      </div>

      <Footer />
    </div>
  );
}
