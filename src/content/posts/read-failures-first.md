---
slug: read-failures-first
title: 做 AI 评测，从读失败样本开始
date: "2026-11-12"
summary: 当用户说「答错了」时，系统究竟在哪一步走偏？先回答这个问题，再决定应该测什么。
topics: [text2sql, evals]
kind: interpretation
takeaways:
  - 先读交互记录，写下每条失败的具体表现，再归类。
  - 查询答错时，沿着「用户问题 → 指标口径 → 查询计划」找出走偏的一步。
source:
  creator: Hamel Husain、Shreya Shankar
  publication: Lenny’s Podcast
  title: Why AI evals are the hottest new skill for product builders
  url: https://www.youtube.com/watch?v=BsWxPI9UM4c&t=1011s
  format: video
---

## 他们先做了什么

访谈里，两位嘉宾拿一个物业管理助手做演示。他们先翻看真实交互记录，读用户的请求和助手的回答，在每条记录旁写下哪里出了问题。积累了一批观察后，才回头把反复出现的失败归到一起。

## 我怎么理解这一步

我喜欢这个顺序。先用具体的话写清楚「这一条为什么错」，后面才有材料判断哪些问题可以合并，哪些值得单独做一条评测。

## 放到 Text2SQL 里，我会怎么用

假设用户问「上月收入」，系统给出一个看似合理的数字。翻记录时，我会把原始问题、识别到的指标、生成的查询计划和实际结果放在一起。把「已确认收入」理解成「实收金额」，和日期边界少算一天，需要补的是两种不同的检查。

1. **读记录**。把问题、计划和结果放在一起。
2. **描述失败**。写出系统从哪一步走偏。
3. **补上检查**。优先覆盖反复出现的失败。

我会先试着检查「用户指定了收入指标时，查询计划选中的指标是否一致」。这个条件能用代码判断，再用几条已知失败的记录确认它是否真的能拦住问题。
