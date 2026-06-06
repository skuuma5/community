import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [totalUsers, totalPosts, totalForums] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.forum.count(),
    ]);

    // Select standard active users (we take up to 8 users for online simulation list)
    const onlineUsers = await db.user.findMany({
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
      take: 8,
    });

    return NextResponse.json({
      stats: {
        totalMembers: totalUsers,
        totalPosts,
        totalForums,
      },
      onlineUsers,
    });
  } catch (error) {
    console.error("API board stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
