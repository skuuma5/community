"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getErrorMessage } from "@/lib/errors";

export async function createForum(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to create a forum." };
    }

    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const rules = formData.get("rules")?.toString().trim() || "";

    if (!name || !description) {
      return { error: "Name and description are required." };
    }

    if (name.length < 3 || name.length > 25) {
      return { error: "Forum name must be between 3 and 25 characters." };
    }

    // Slug generation
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      return { error: "Invalid forum name." };
    }

    // Check slug uniqueness
    const existingForum = await db.forum.findUnique({
      where: { slug },
    });

    if (existingForum) {
      return { error: "A community with a similar name already exists." };
    }

    const logoUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${slug}`;

    // Create forum and add owner as member
    await db.$transaction(async (tx) => {
      const forum = await tx.forum.create({
        data: {
          name,
          slug,
          description,
          rules,
          logoUrl,
          ownerId: user.id,
          memberCount: 1,
        },
      });

      await tx.forumMember.create({
        data: {
          userId: user.id,
          forumId: forum.id,
          role: "OWNER",
        },
      });
    });

    revalidatePath("/forums");
    return { success: true, slug };
  } catch (error) {
    console.error("Create forum error:", error);
    return { error: getErrorMessage(error, "Failed to create forum.") };
  }
}

export async function toggleForumMembership(forumId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to join a community." };
    }

    const userId = user.id;

    // Check if membership exists
    const membership = await db.forumMember.findUnique({
      where: {
        userId_forumId: { userId, forumId },
      },
    });

    const forum = await db.forum.findUnique({ where: { id: forumId } });
    if (!forum) {
      return { error: "Community not found." };
    }

    if (membership) {
      if (membership.role === "OWNER") {
        return { error: "The owner cannot leave their own community." };
      }

      // Leave
      await db.$transaction(async (tx) => {
        await tx.forumMember.delete({
          where: { userId_forumId: { userId, forumId } },
        });

        await tx.forum.update({
          where: { id: forumId },
          data: {
            memberCount: { decrement: 1 },
          },
        });
      });

      revalidatePath(`/forums/${forum.slug}`);
      return { success: true, joined: false };
    } else {
      // Join
      await db.$transaction(async (tx) => {
        await tx.forumMember.create({
          data: {
            userId,
            forumId,
            role: "MEMBER",
          },
        });

        await tx.forum.update({
          where: { id: forumId },
          data: {
            memberCount: { increment: 1 },
          },
        });
      });

      revalidatePath(`/forums/${forum.slug}`);
      return { success: true, joined: true };
    }
  } catch (error) {
    console.error("Toggle membership error:", error);
    return { error: getErrorMessage(error, "Failed to perform operation.") };
  }
}

export async function getTrendingForums() {
  try {
    // Ranked by member count + post count (popularity metric)
    const forums = await db.forum.findMany({
      orderBy: [
        { memberCount: "desc" },
        { postCount: "desc" },
      ],
      take: 5,
    });
    return { forums };
  } catch (error) {
    console.error("Get trending forums error:", error);
    return { forums: [] };
  }
}
