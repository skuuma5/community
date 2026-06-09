import db from "@/lib/db";
import { redirect } from "next/navigation";
import { logServerError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface RedirectPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function RedirectEntityPage({ searchParams }: RedirectPageProps) {
  const params = await searchParams;
  const id = params.id;

  if (!id) {
    redirect("/");
  }

  let targetPath: string | null = null;

  try {
    const post = await db.post.findUnique({
      where: { id },
      include: {
        forum: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (post) {
      targetPath = `/forums/${post.forum.slug}/posts/${post.id}`;
    }
  } catch (error) {
    logServerError("RedirectEntityPage.post", error);
  }

  if (targetPath) {
    redirect(targetPath);
  }

  redirect("/");
}
