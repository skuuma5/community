import db from "@/lib/db";
import { redirect } from "next/navigation";

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
    redirect(`/forums/${post.forum.slug}/posts/${post.id}`);
  }

  redirect("/");
}
