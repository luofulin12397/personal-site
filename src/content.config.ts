import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { topics } from "./site";

const text = z.string().trim().min(1);
const source = z.object({
  creator: text,
  publication: text,
  title: text.optional(),
  url: z.url({ protocol: /^https?$/ }),
  format: z.enum(["video", "article"]),
});

const metadata = {
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: text,
  date: z.iso.date(),
  summary: text,
  topics: z.array(z.enum(topics.map((topic) => topic.slug))).min(1)
    .refine((values) => new Set(values).size === values.length, "文章不能重复填写同一主题"),
  note: z.boolean().default(false),
  draft: z.boolean().default(false),
  takeaways: z.array(text).optional(),
};

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.md",
    // 文件路径作内部 ID，保留同 slug 的记录以便构建时报告冲突。
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.discriminatedUnion("kind", [
    z.object({ ...metadata, kind: z.literal("original") }),
    z.object({ ...metadata, kind: z.literal("interpretation"), source }),
  ]),
});

export const collections = { posts };
