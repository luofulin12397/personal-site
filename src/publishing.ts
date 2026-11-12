import { getCollection, type CollectionEntry } from "astro:content";
import { topics, type TopicSlug } from "./site";

export type Post = CollectionEntry<"posts">;

export async function publishedPosts() {
  const posts = await getCollection("posts");
  const slugs = new Map<string, string>();
  for (const { id, data } of posts) {
    const other = slugs.get(data.slug);
    if (other !== undefined) {
      throw new Error(`文章 slug 重复：${data.slug}（${other}.md 与 ${id}.md）`);
    }
    slugs.set(data.slug, id);
  }
  return posts.filter(({ data }) => !data.draft).sort((first, second) =>
    second.data.date.localeCompare(first.data.date) || first.data.slug.localeCompare(second.data.slug)
  );
}

export function postsByTopic(posts: Post[]) {
  return topics.map((topic) => ({
    ...topic,
    posts: posts.filter(({ data }) => data.topics.includes(topic.slug)),
  }));
}

export function postTopics(post: Post) {
  return post.data.topics.map((slug: TopicSlug) => topics.find((topic) => topic.slug === slug)!);
}

export function postLabel({ data }: Post) {
  const kind = data.kind === "original" ? "原创" : "解读";
  return data.note ? `${kind}笔记` : kind;
}
