import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { logServerError } from "@/lib/errors";

export async function getCurrentUserId() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return user?.id ?? null;
  } catch (error) {
    logServerError("getCurrentUserId", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return null;
    }

    return await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        reputation: true,
        avatarUrl: true,
      },
    });
  } catch (error) {
    logServerError("getCurrentUser", error);
    return null;
  }
}
