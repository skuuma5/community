"use server";

import db from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function sendPrivateMessage(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
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

    if (receiver.id === session.user.id) {
      return { error: "You cannot send a private message to yourself." };
    }

    const senderUsername = session.user.username;

    // Create message and trigger a notification
    await db.$transaction(async (tx) => {
      await tx.privateMessage.create({
        data: {
          senderId: session.user.id,
          receiverId: receiver.id,
          content,
        },
      });

      await tx.notification.create({
        data: {
          userId: receiver.id,
          senderId: session.user.id,
          type: "PRIVATE_MESSAGE",
          content: `You received a new private message from ${senderUsername}.`,
        },
      });
    });

    revalidatePath("/messages");
    return { success: true };
  } catch (error: any) {
    console.error("Send private message error:", error);
    return { error: "Failed to send private message." };
  }
}

export async function markMessagesAsRead(senderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return;

    await db.privateMessage.updateMany({
      where: {
        senderId,
        receiverId: session.user.id,
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
  }
}
