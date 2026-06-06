"use server";

import db from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function markNotificationsAsRead() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "You must be logged in." };
    }

    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return { error: "Failed to mark notifications as read." };
  }
}

export async function getUnreadNotificationCount() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return 0;

    return await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Get unread notifications count error:", error);
    return 0;
  }
}
