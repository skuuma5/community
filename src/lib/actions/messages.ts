"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getErrorMessage } from "@/lib/errors";

export async function sendPrivateMessage(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to send messages." };
    }

    const receiverUsername = formData.get("receiverUsername")?.toString().trim();
    const content = formData.get("content")?.toString().trim();

    if (!receiverUsername || !content) {
      return { error: "Recipient and message content are required." };
    }

    // Find receiver
    const receiver = await db.user.findUnique({
      where: { username: receiverUsername },
    });

    if (!receiver) {
      return { error: `User "${receiverUsername}" not found.` };
    }

    if (receiver.id === user.id) {
      return { error: "You cannot send a private message to yourself." };
    }

    const senderUsername = user.username;

    // Create message and trigger a notification
    await db.$transaction(async (tx) => {
      await tx.privateMessage.create({
        data: {
          senderId: user.id,
          receiverId: receiver.id,
          content,
        },
      });

      await tx.notification.create({
        data: {
          userId: receiver.id,
          senderId: user.id,
          type: "PRIVATE_MESSAGE",
          content: `You received a new private message from ${senderUsername}.`,
        },
      });
    });

    revalidatePath("/messages");
    return { success: true };
  } catch (error) {
    console.error("Send private message error:", error);
    return { error: getErrorMessage(error, "Failed to send private message.") };
  }
}

export async function markMessagesAsRead(senderId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "You must be logged in." };

    await db.privateMessage.updateMany({
      where: {
        senderId,
        receiverId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/messages");
    return { success: true };
  } catch (error) {
    console.error("Mark messages read error:", error);
    return { error: getErrorMessage(error, "Failed to mark messages as read.") };
  }
}
