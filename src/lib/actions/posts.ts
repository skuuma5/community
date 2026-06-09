"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PostType } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { getErrorMessage } from "@/lib/errors";

export async function createPost(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to post." };
    }

    const title = formData.get("title")?.toString().trim();
    const content = formData.get("content")?.toString().trim();
    const forumId = formData.get("forumId")?.toString();
    const typeStr = formData.get("type")?.toString() || "TEXT";
    const mediaUrl = formData.get("mediaUrl")?.toString().trim() || null;
    const linkUrl = formData.get("linkUrl")?.toString().trim() || null;

    if (!title || !content || !forumId) {
      return { error: "Title, content, and category are required." };
    }

    if (title.length < 5 || title.length > 100) {
      return { error: "Title must be between 5 and 100 characters." };
    }

    // Verify member is part of forum or forum exists
    const forum = await db.forum.findUnique({ where: { id: forumId } });
    if (!forum) {
      return { error: "Forum community not found." };
    }

    const type = typeStr as PostType;

    // Create post and increment postCount
    const post = await db.$transaction(async (tx) => {
      const p = await tx.post.create({
        data: {
          title,
          content,
          type,
          mediaUrl: type === "IMAGE" ? mediaUrl : null,
          linkUrl: type === "LINK" ? linkUrl : null,
          userId: user.id,
          forumId,
        },
      });

      await tx.forum.update({
        where: { id: forumId },
        data: {
          postCount: { increment: 1 },
        },
      });

      // Award 5 reputation to author for publishing a discussion thread
      await tx.user.update({
        where: { id: user.id },
        data: {
          reputation: { increment: 5 },
        },
      });

      return p;
    });

    revalidatePath("/");
    revalidatePath(`/forums/${forum.slug}`);
    return { success: true, postId: post.id };
  } catch (error) {
    console.error("Create post error:", error);
    return { error: getErrorMessage(error, "Failed to create post thread.") };
  }
}

export async function toggleLikePost(postId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to like posts." };
    }

    const userId = user.id;

    // Check if like exists
    const existingLike = await db.postLike.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return { error: "Post thread not found." };
    }

    if (existingLike) {
      // Unlike
      await db.$transaction(async (tx) => {
        await tx.postLike.delete({
          where: { userId_postId: { userId, postId } },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likeCount: { decrement: 1 },
          },
        });

        // Deduct 5 reputation from post owner (karma penalty for losing like)
        if (post.userId !== userId) {
          await tx.user.update({
            where: { id: post.userId },
            data: {
              reputation: { decrement: 5 },
            },
          });
        }
      });

      return { success: true, liked: false };
    } else {
      // Like
      await db.$transaction(async (tx) => {
        await tx.postLike.create({
          data: { userId, postId },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likeCount: { increment: 1 },
          },
        });

        // Award 5 reputation to post owner (karma reward for receiving like)
        if (post.userId !== userId) {
          await tx.user.update({
            where: { id: post.userId },
            data: {
              reputation: { increment: 5 },
            },
          });

          // Create notification for post owner
          const liker = user.username;
          await tx.notification.create({
            data: {
              userId: post.userId,
              senderId: userId,
              type: "LIKE",
              entityId: postId,
              content: `${liker} liked your thread "${post.title.substring(0, 30)}..."`,
            },
          });
        }
      });

      return { success: true, liked: true };
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return { error: getErrorMessage(error, "Failed to process like.") };
  }
}

export async function toggleBookmarkPost(postId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to bookmark." };
    }

    const userId = user.id;

    const existingBookmark = await db.postBookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingBookmark) {
      await db.postBookmark.delete({
        where: { userId_postId: { userId, postId } },
      });
      return { success: true, bookmarked: false };
    } else {
      await db.postBookmark.create({
        data: { userId, postId },
      });
      return { success: true, bookmarked: true };
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return { error: getErrorMessage(error, "Failed to bookmark.") };
  }
}

export async function incrementPostViews(postId: string) {
  try {
    await db.post.update({
      where: { id: postId },
      data: {
        viewCount: { increment: 1 },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Increment views error:", error);
    return { error: getErrorMessage(error, "Failed to increment views.") };
  }
}
