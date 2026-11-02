# 可恢复交接

更新时间：2026-11-03 03:30（Asia/Shanghai）

- 当前 Agent：Codex（GitHub 发布完成）；WorkBuddy AI 已停止，未并行写入
- 当前阶段：G0～G4 通过；网页学习器功能已按需求补齐；S5 协调器内核完成，ORG-007 与 G5 剩余测试未完成
- 未提交改动：交接时以 `git status --short` 复核
- 主要文件：`apps/trainer/src/`（pages/review/texts/ui/data）、`apps/coordinator/src/`
- 最近测试：trainer 20 文件/197 测试；coordinator 6 文件/35 测试；V2.1 `npm run verify:ui` 56 项完整回归通过
- 运行方式：`npm run build` → `npm run preview --workspace @xiaohe/trainer`（4174）；协调器 `npm run coord -- ...`
- 审批边界：真实 Agent 调用消耗订阅额度，必须逐次同意；G5 未完成 T06/T09/T10/T12 前不得声称通过
- V1 恢复点：Git 标签 `v1-workbuddy`（`cef5ee3`）；V2 设计审查见 `docs/V2_DESIGN_REVIEW.md`
- 最新需求覆盖：仅浅色主题；自定义文本改为离线逐字双拼练习。见 `docs/DECISION_OVERRIDES.md`
- GitHub 发布：公开仓库 <https://github.com/entropyflo/hejng-shuangpin> 已上线；图文 README、V1/V2 Release、精选截图、GIF/MP4 均已发布，V2 Release 附带可下载 MP4 演示视频
- 下一最小行动：按用户优先级选择——V2.1 人工体验或协调器 ORG-007
- 已知限制：答题音效听感需人工确认；指法提示已按用户要求删除；罕见字若离线词典无法编码会保留显示但跳过输入；XP 与混合权重为自定义规则；Windows/PWA 安装/屏幕阅读器未实测
- 回滚风险：IndexedDB 已升到 v3（新增 texts），降级会丢自定义文本；不要用 `git reset --hard`
