import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const astro = join(project, "node_modules", "astro", "bin", "astro.mjs");

function fixture(t) {
  const root = mkdtempSync(join(project, ".site-test-"));
  t.after(() => {
    assert.equal(dirname(root), project.slice(0, -1));
    rmSync(root, { recursive: true });
  });
  for (const file of ["package.json", "astro.config.mjs", "tsconfig.json"]) {
    cpSync(join(project, file), join(root, file));
  }
  const source = join(project, "src");
  if (existsSync(source)) {
    cpSync(source, join(root, "src"), {
      recursive: true,
      filter: (path) => path !== join(source, "content", "posts"),
    });
  }
  const posts = join(root, "src", "content", "posts");
  mkdirSync(posts, { recursive: true });

  return {
    write(name, content) {
      writeFileSync(join(root, name), content, "utf8");
    },
    build(env = {}) {
      const result = spawnSync(process.execPath, [astro, "build"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1", SITE_URL: "", CONTACT_EMAIL: "", ...env },
      });
      assert.equal(result.status, 0, result.error?.message ?? result.stdout + result.stderr);
    },
    page(path) {
      return readFileSync(join(root, "dist", path), "utf8");
    },
    hasPage(path) {
      return existsSync(join(root, "dist", path));
    },
  };
}

function interpretation(draft = false) {
  return `---
slug: cross-topic
title: 跨主题解读
date: "2026-10-10"
summary: 一篇用于验证发布流程的文章。
topics: [text2sql, evals]
kind: interpretation
draft: ${draft}
source:
  creator: 示例分享者
  publication: 示例技术分享
  url: https://example.org/video
  format: video
---

## 原分享的观点

先找到重复出现的失败。

## 我的应用思路

沿查询链路定位错误。
`;
}

function topicCount(slug, count) {
  return new RegExp(`href="/topics/${slug}/"[^>]*>\\s*<strong>[^<]+</strong><span class="topic-count">${count} 篇</span>`);
}

test("一份 Markdown 在两个主题中指向同一篇正文，转为草稿后退出发布", (t) => {
  const site = fixture(t);
  site.write("src/content/posts/cross-topic.md", interpretation());
  site.build();

  for (const slug of ["text2sql", "evals"]) {
    const topic = site.page(`topics/${slug}/index.html`);
    assert.match(topic, /href="\/posts\/cross-topic\//);
    assert.match(topic, topicCount(slug, 1));
  }
  const post = site.page("posts/cross-topic/index.html");
  assert.match(post, /示例分享者/);
  assert.match(post, /href="\/topics\/text2sql\//);
  assert.match(post, /href="\/topics\/evals\//);
  assert.match(post, /href="https:\/\/example\.org\/video"/);
  assert.match(post, /观看原视频/);

  site.write("src/content/posts/cross-topic.md", interpretation(true));
  site.build();

  assert.equal(site.hasPage("posts/cross-topic/index.html"), false);
  assert.doesNotMatch(site.page("index.html"), /href="\/posts\/cross-topic\//);
  for (const slug of ["text2sql", "evals"]) {
    const topic = site.page(`topics/${slug}/index.html`);
    assert.doesNotMatch(topic, /href="\/posts\/cross-topic\//);
    assert.match(topic, topicCount(slug, 0));
  }
});

test("精选在首页只展示一次，取消精选后回到按日期排序的近期分享", (t) => {
  const site = fixture(t);
  site.write("src/content/posts/cross-topic.md", interpretation());
  site.write("src/content/posts/second.md", `---
slug: second
title: 第二篇文章
date: "2026-10-09"
summary: 第二篇用于验证排序的文章。
topics: [text2sql]
kind: original
---

正文。
`);
  const selection = { slug: "cross-topic", reason: "这里是一句独立的推荐语。" };
  site.write("src/featured.json", JSON.stringify({ featured: selection }));
  site.build();

  const home = site.page("index.html");
  assert.match(home, /我推荐先读/);
  assert.match(home, /这里是一句独立的推荐语/);
  assert.equal(home.match(/跨主题解读/g)?.length, 1);
  assert.match(site.page("topics/text2sql/index.html"), /href="\/posts\/cross-topic\//);

  site.write("src/featured.json", "{}");
  site.build();
  const updated = site.page("index.html");
  assert.doesNotMatch(updated, /我推荐先读/);
  assert.match(updated, /近期分享[\s\S]*跨主题解读[\s\S]*第二篇文章/);
});

test("配置正式站地址和邮箱后，关于页提供 RSS 与邮件入口", (t) => {
  const site = fixture(t);
  site.write("src/content/posts/cross-topic.md", interpretation());
  site.build({ SITE_URL: "https://example.org/", CONTACT_EMAIL: "hello@example.org" });

  const about = site.page("about/index.html");
  assert.match(about, /href="\/rss\.xml"/);
  assert.match(about, /href="mailto:hello@example\.org"/);
  assert.match(site.page("rss.xml"), /https:\/\/example\.org\/posts\/cross-topic\//);
});
