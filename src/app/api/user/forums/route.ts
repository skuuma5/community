import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ forums: [] });
    }

    const memberships = await db.forumMember.findMany({
      where: { userId: session.user.id },
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
