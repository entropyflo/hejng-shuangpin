# 可恢复交接

更新时间：2026-11-02 23:24（Asia/Shanghai）

- 当前 Agent：WorkBuddy AI（本次会话）；上一写者 Codex 已停止，未并行写入
- 当前阶段：G0、G1 通过；S2 的 UI-001～004 全部完成，**G2 等待用户验收**
- 未提交改动：交接时以 `git status --short` 复核
- 主要文件：`apps/trainer/src/app/`（router/theme/preferences/settings/storage/App）、`apps/trainer/src/pages/`、`apps/trainer/src/ui/`、`apps/trainer/src/curriculum/`
- 最近测试：`npm run typecheck` PASS；`npm test` 9 文件/123 测试 PASS；`npm run build` PASS；`npm run verify:ui` 27 项浏览器断言 PASS
- 浏览器证据：`docs/evidence/s2-home-light.png`、`s2-home-dark.png`、`s2-lesson.png`、`s2-speed.png`、`s2-ime.png`、`s2-fingering.png`、`s2-focus.png`、`s2-settings.png`
- 验证方式：`npm run build` → `npm run preview --workspace @xiaohe/trainer` → `npm run verify:ui`（默认 `http://127.0.0.1:4174/`，可用 `VERIFY_URL` 覆盖）
- 审批边界：G2 必须由用户完成，且必须包含真实系统输入法测试；未通过不得进入 S3
- 下一最小行动：等待 G2 结果；通过后从 S3 数据层（IndexedDB + 事件记录）开始
- 已知限制：IME 仅合成事件验证（SIMULATED_ONLY）；音效未听感验收；混合训练加权、CPM、复习排程待 S3；Windows/PWA/屏幕阅读器未验证
- 回滚风险：无数据迁移；不要用 `git reset --hard`，如需撤销按提交普通 revert
