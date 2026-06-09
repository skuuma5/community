import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await db.forumMember.findMany({
      where: { userId },
      include: {
        forum: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    const forums = memberships.map((m) => m.forum);

    return NextResponse.json({ forums });
  } catch (error) {
    console.error("API user forums error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
