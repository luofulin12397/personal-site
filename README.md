# 罗富麟的个人技术网站

以 Markdown 发布工程经验、学习笔记和技术分享解读。站点由 Astro 生成静态页面。

## 本地开发

使用 Node.js 22.12 或更高版本，在本目录运行以下命令。

```sh
npm ci
npm run dev
```

`npm run check` 检查类型，`npm test` 用临时样例验证构建行为，`npm run build` 生成 `dist/`。运行 `npm run preview` 可以查看生成结果。

## 发一篇文章

在 `src/content/posts/` 下新建 Markdown。库里的文章是用于预览和替换的样稿。

```yaml
---
slug: my-first-post
title: 我的第一篇技术笔记
date: "2026-11-12"
summary: 一句话写清读者能从这篇看到什么。
topics: [text2sql, evals]
kind: original
note: true
draft: true
---
```

- `slug` 是正文地址的一部分，全站唯一。主题在 `src/site.ts` 中定义。
- `kind` 为 `interpretation` 时，在 `source` 下填写 `creator`、`publication`、`url` 和 `format`（`video` 或 `article`）。可选的 `title` 显示在文末。
- `takeaways` 可填为要点列表，显示在正文前。准备发布时将 `draft` 改为 `false`。
- 在 `src/featured.json` 修改精选的 `slug` 和推荐语 `reason`。可按内容配置三步简图。将文件内容设为 `{}` 可取消精选。

构建时设置 `SITE_URL` 为正式站点地址，即可生成 `/rss.xml`。设置 `CONTACT_EMAIL` 为公开邮箱后，「关于」页会显示邮件入口。
