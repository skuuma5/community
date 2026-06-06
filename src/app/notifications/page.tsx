import db from "@/lib/db";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Bell, Heart, MessageSquare, UserCheck, Inbox, ShieldAlert, ArrowLeft } from "lucide-react";
import { markNotificationsAsRead } from "@/lib/actions/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#1b2631] rounded board-container max-w-lg mx-auto my-12 text-xs">
        <h3 className="font-bold text-red-600 text-sm mb-2">Authentication Required</h3>
        <p className="text-slate-500 mb-4">You must log in to view your user notification alerts.</p>
        <Link href="/login" className="retro-btn">Log In</Link>
      </div>
    );
  }

  // Mark all notifications as read on view load (Server Action call inside server component render - safe since it's a mutation helper)
  try {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  } catch (err) {
    console.error("Failed to mark notifications read on load:", err);
  }

  // Query notifications
  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    include: {
      sender: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "COMMENT":
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case "FOLLOW":
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case "PRIVATE_MESSAGE":
        return <Inbox className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Breadcrumbs */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs flex justify-between items-center text-slate-600 dark:text-slate-400">
        <div>
          <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
            Board Index
          </Link>
          <span className="mx-2">&raquo;</span>
          <span>Alert Notifications</span>
        </div>
        <Link href="/" className="text-slate-500 hover:underline flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-0.5" /> Back Index
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Left col */}
        <LeftSidebar />

        {/* Center: list */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="board-container rounded overflow-hidden">
            {/* Header banner */}
            <div className="glossy-header text-xs py-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <Bell className="w-3.5 h-3.5 mr-1" /> Board Notification Center
              </span>
              <span className="text-[10px] text-slate-200">
                Displaying last 30 alerts
              </span>
            </div>

            {/* Notifications Rows */}
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
              {notifications.length > 0 ? (
                notifications.map((n) => {
                  const formattedTime = new Date(n.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={n.id}
                      className={`forum-row flex items-start gap-3.5 p-3.5 text-xs ${
                        !n.isRead ? "bg-amber-50/20 dark:bg-amber-950/10 border-l-2 border-amber-500" : ""
                      }`}
                    >
                      {/* Left icon status */}
                      <div className="bg-slate-100 dark:bg-[#1a2530] border border-slate-300 dark:border-slate-800 p-2 rounded shadow-inner flex-shrink-0 flex items-center justify-center">
                        {getIcon(n.type)}
                      </div>

                      {/* Content details */}
                      <div className="flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-slate-700 dark:text-slate-200 font-semibold">{n.content}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
                        </div>
                        
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                          <span>
                            Event source: <strong className="text-slate-500">{n.type}</strong>
                          </span>
                          
                          {/* Thread redirect url */}
                          {n.entityId && (n.type === "LIKE" || n.type === "COMMENT") && (
                            <Link
                              href={`/forums/redirect-entity?id=${n.entityId}`}
                              className="text-[#105289] dark:text-[#4a90e2] font-bold hover:underline"
                            >
                              Go to Post Thread &raquo;
                            </Link>
                          )}

                          {n.type === "PRIVATE_MESSAGE" && (
                            <Link
                              href={`/messages?user=${n.sender?.username || ""}`}
                              className="text-[#105289] dark:text-[#4a90e2] font-bold hover:underline"
                            >
                              Open Folder Inbox &raquo;
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-slate-500">
                  You do not have any notification alerts on your dashboard index.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right col */}
        <RightSidebar />
      </div>

      <Footer />
    </div>
  );
}
