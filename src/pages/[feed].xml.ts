import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { publishedPosts } from "../publishing";
import { postHref, site } from "../site";

export function getStaticPaths() {
  return import.meta.env.SITE ? [{ params: { feed: "rss" } }] : [];
}

export async function GET(context: APIContext) {
  if (!context.site) return new Response(null, { status: 404 });
  const posts = await publishedPosts();

  return rss({
    title: `${site.name} · 个人技术笔记`,
    description: site.description,
    site: context.site,
    items: posts.map(({ data }) => ({
      title: data.title,
      description: data.summary,
      pubDate: new Date(`${data.date}T00:00:00+08:00`),
      link: postHref(data.slug),
    })),
    trailingSlash: true,
  });
}
