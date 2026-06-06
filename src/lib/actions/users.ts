"use server";

import db from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { storage } from "@/lib/storage";

export async function toggleFollowUser(targetUserId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "You must be logged in to follow users." };
    }

    const followerId = session.user.id;

    if (followerId === targetUserId) {
      return { error: "You cannot follow yourself." };
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return { error: "User not found." };
    }

    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId: targetUserId },
      },
    });

    const followerUsername = session.user.username;

    if (existingFollow) {
      // Unfollow
      await db.$transaction(async (tx) => {
        await tx.follow.delete({
          where: {
            followerId_followingId: { followerId, followingId: targetUserId },
          },
        });

        // Deduct 2 reputation points for losing a follower
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            reputation: { decrement: 2 },
          },
        });
      });

      revalidatePath(`/profile/${targetUser.username}`);
      return { success: true, followed: false };
    } else {
      // Follow
      await db.$transaction(async (tx) => {
        await tx.follow.create({
          data: { followerId, followingId: targetUserId },
        });

        // Award 2 reputation points for gaining a follower
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            reputation: { increment: 2 },
          },
        });

        // Create follow notification
        await tx.notification.create({
          data: {
            userId: targetUserId,
            senderId: followerId,
            type: "FOLLOW",
            content: `${followerUsername} is now following your dashboard.`,
          },
        });
      });

      revalidatePath(`/profile/${targetUser.username}`);
      return { success: true, followed: true };
    }
  } catch (error: any) {
    console.error("Toggle follow error:", error);
    return { error: "Failed to process follow." };
  }
}

/**
 * Reset the current user's avatar back to the default DiceBear pixel art.
 * Deletes the uploaded file via the storage adapter if it was a local upload.
 */
export async function resetAvatar() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "You must be logged in." };
    }

    // Fetch current avatar URL
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true, username: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    // Delete uploaded file via storage adapter (no-op for external URLs)
    if (user.avatarUrl) {
      await storage.delete(user.avatarUrl);
    }

    // Reset to DiceBear default
    const defaultAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`;

    await db.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: defaultAvatar },
    });

    revalidatePath(`/profile/${user.username}`);
    return { success: true, avatarUrl: defaultAvatar };
  } catch (error) {
    console.error("Reset avatar error:", error);
    return { error: "Failed to reset avatar." };
  }
}
