"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { storage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/session";
import { getErrorMessage } from "@/lib/errors";

export async function toggleFollowUser(targetUserId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to follow users." };
    }

    const followerId = user.id;

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

    const followerUsername = user.username;

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
  } catch (error) {
    console.error("Toggle follow error:", error);
    return { error: getErrorMessage(error, "Failed to process follow.") };
  }
}

/**
 * Reset the current user's avatar back to the default DiceBear pixel art.
 * Deletes the uploaded file via the storage adapter if it was a local upload.
 */
export async function resetAvatar() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: "You must be logged in." };
    }

    // Fetch current avatar URL
    const user = await db.user.findUnique({
      where: { id: currentUser.id },
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
      where: { id: currentUser.id },
      data: { avatarUrl: defaultAvatar },
    });

    revalidatePath(`/profile/${user.username}`);
    return { success: true, avatarUrl: defaultAvatar };
  } catch (error) {
    console.error("Reset avatar error:", error);
    return { error: getErrorMessage(error, "Failed to reset avatar.") };
  }
}
