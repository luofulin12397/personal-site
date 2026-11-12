# 本地工单

以功能为单位，将规格和工单写入 `.scratch/<feature-slug>/`。

| 内容 | 路径 |
| --- | --- |
| 功能规格 | `.scratch/<feature-slug>/spec.md` |
| 实现工单 | `.scratch/<feature-slug>/issues/<NN>-<slug>.md` |
| Wayfinder 决策地图 | `.scratch/<effort>/map.md` |

- 创建工单时，每个文件只记录一个工单。编号从 `01` 开始。
- 分诊状态写在工单开头的 `Status:` 行。可用值见 [分诊状态](triage-labels.md)。
- 查找工单时，优先使用用户提供的文件路径或工单编号。讨论记录追加在该文件的 `## Comments` 下。

## Wayfinder

- 决策工单沿用工单路径。开头用 `Type:` 记录 `research`、`prototype`、`grilling` 或 `task`，用 `Blocked by:` 记录所依赖的工单编号。
- 按编号挑选第一个仍待处理且依赖均为 `resolved` 的工单。开始处理时将 `Status:` 设为 `claimed`。
- 完成后在工单的 `## Answer` 下记录结论，将 `Status:` 设为 `resolved`，并把结论和工单链接补到决策地图中。
