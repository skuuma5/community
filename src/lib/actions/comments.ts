"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getErrorMessage } from "@/lib/errors";

export async function createComment(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to comment." };
    }

    const content = formData.get("content")?.toString().trim();
    const postId = formData.get("postId")?.toString();
    const parentId = formData.get("parentId")?.toString() || null;

    if (!content || !postId) {
      return { error: "Comment content is required." };
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      include: { forum: true },
    });
    if (!post) {
      return { error: "Post thread not found." };
    }

    const commenter = user.username;

    // Create comment, increment post commentCount, and award commenter +2 reputation
    const comment = await db.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          content,
          postId,
          parentId,
          userId: user.id,
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      // Award +2 rep for contributing to the discussion
      await tx.user.update({
        where: { id: user.id },
        data: {
          reputation: { increment: 2 },
        },
      });

      // Notify post owner
      if (post.userId !== user.id && !parentId) {
        await tx.notification.create({
          data: {
            userId: post.userId,
            senderId: user.id,
            type: "COMMENT",
            entityId: postId,
            content: `${commenter} replied to your thread "${post.title.substring(0, 30)}..."`,
          },
        });
      }

      // Notify parent commenter if nested
      if (parentId) {
        const parentComment = await tx.comment.findUnique({
          where: { id: parentId },
        });

        if (parentComment && parentComment.userId !== user.id) {
          await tx.notification.create({
            data: {
              userId: parentComment.userId,
              senderId: user.id,
              type: "COMMENT",
              entityId: postId,
              content: `${commenter} replied to your reply in "${post.title.substring(0, 30)}..."`,
            },
          });
        }
      }

      return c;
    });

    revalidatePath(`/forums/${post.forum.slug}/posts/${postId}`);
    return { success: true, commentId: comment.id };
  } catch (error) {
    console.error("Create comment error:", error);
    return { error: getErrorMessage(error, "Failed to post comment.") };
  }
}

export async function toggleLikeComment(commentId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to like comments." };
    }

    const userId = user.id;

    // Check if like exists
    const existingLike = await db.commentLike.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    const comment = await db.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return { error: "Comment not found." };
    }

    if (existingLike) {
      // Unlike
      await db.$transaction(async (tx) => {
        await tx.commentLike.delete({
          where: { userId_commentId: { userId, commentId } },
        });

        await tx.comment.update({
          where: { id: commentId },
          data: {
            likeCount: { decrement: 1 },
          },
        });

        // Deduct 2 reputation from comment owner
        if (comment.userId !== userId) {
          await tx.user.update({
            where: { id: comment.userId },
            data: {
              reputation: { decrement: 2 },
            },
          });
        }
      });

      return { success: true, liked: false };
    } else {
      // Like
      await db.$transaction(async (tx) => {
        await tx.commentLike.create({
          data: { userId, commentId },
        });

        await tx.comment.update({
          where: { id: commentId },
          data: {
            likeCount: { increment: 1 },
          },
        });

        // Award 2 reputation to comment owner
        if (comment.userId !== userId) {
          await tx.user.update({
            where: { id: comment.userId },
            data: {
              reputation: { increment: 2 },
            },
          });

          // Create notification
          const liker = user.username;
          await tx.notification.create({
            data: {
              userId: comment.userId,
              senderId: userId,
              type: "LIKE",
              entityId: comment.postId,
              content: `${liker} liked your comment: "${comment.content.substring(0, 30)}..."`,
            },
          });
        }
      });

      return { success: true, liked: true };
    }
  } catch (error) {
    console.error("Toggle comment like error:", error);
    return { error: getErrorMessage(error, "Failed to process comment like.") };
  }
}
