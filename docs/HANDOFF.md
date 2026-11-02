# 可恢复交接

更新时间：2026-11-02 22:46（Asia/Shanghai）

- 当前 Agent：WorkBuddy AI（本次会话）；上一写者 Codex 已停止，未并行写入
- 当前阶段：G0 通过；S1 的 SCH-001～003、CUR-001～002、VER-001 全部完成；**G1 等待用户验收**
- 未提交改动：交接时以 `git status --short` 复核
- 主要文件：`apps/trainer/src/scheme/`、`apps/trainer/src/curriculum/`、`apps/trainer/src/ui/`、`scripts/verify-s1-ui.mjs`
- 最近测试：`npm run typecheck` PASS；`npm test` 5 文件/84 测试 PASS；`npm run build` PASS；`node scripts/verify-s1-ui.mjs` 11 项浏览器断言 PASS
- 浏览器证据：`docs/evidence/s1-ui-verify.png`、`s1-keyboard-verify.png`、`s1-readings-verify.png`
- 验证方式：`npm run build` → `npm run preview --workspace @xiaohe/trainer` → `npm run verify:ui`（默认 `http://127.0.0.1:4174/`，可用 `VERIFY_URL` 覆盖）
- 审批边界：G1 必须由用户按 `TEST_ACCEPTANCE.md` 验收，未通过不得进入 S2
- 下一最小行动：等待 G1 结果；通过后从 UI-001（首页与主题）开始 S2
- 已知限制：真实系统 IME、Windows、PWA 安装/断网均为 `NOT_RUN`；速度挑战只展示题目，未实现计时与 CPM
- 回滚风险：无数据迁移；不要用 `git reset --hard`，如需撤销按提交普通 revert
