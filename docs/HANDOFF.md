# 可恢复交接

更新时间：2026-11-03 00:02（Asia/Shanghai）

- 当前 Agent：WorkBuddy AI（本次会话）；上一写者 Codex 已停止，未并行写入
- 当前阶段：G0～G4 通过；网页学习器功能已按需求补齐；S5 协调器内核完成，ORG-007 与 G5 剩余测试未完成
- 未提交改动：交接时以 `git status --short` 复核
- 主要文件：`apps/trainer/src/`（pages/review/texts/ui/data）、`apps/coordinator/src/`
- 最近测试：trainer 20 文件/198 测试；coordinator 6 文件/35 测试；`npm run verify:ui` 45 项断言通过
- 运行方式：`npm run build` → `npm run preview --workspace @xiaohe/trainer`（4174）；协调器 `npm run coord -- ...`
- 审批边界：真实 Agent 调用消耗订阅额度，必须逐次同意；G5 未完成 T06/T09/T10/T12 前不得声称通过
- 下一最小行动：按用户优先级选择——网页增强（自定义文本词典）或协调器 ORG-007
- 已知限制：自定义文本仅输入法模式；XP 与混合权重为自定义规则；Windows/PWA 安装/屏幕阅读器未实测
- 回滚风险：IndexedDB 已升到 v3（新增 texts），降级会丢自定义文本；不要用 `git reset --hard`
