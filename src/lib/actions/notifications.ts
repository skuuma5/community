"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/session";
import { getErrorMessage } from "@/lib/errors";

export async function markNotificationsAsRead() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "You must be logged in." };
    }

    await db.notification.updateMany({
      where: {
        userId,
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
    return { error: getErrorMessage(error, "Failed to mark notifications as read.") };
  }
}

export async function getUnreadNotificationCount() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    return await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Get unread notifications count error:", error);
    return 0;
  }
}
