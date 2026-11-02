# 可恢复交接

更新时间：2026-11-02 22:56（Asia/Shanghai）

- 当前 Agent：WorkBuddy AI（本次会话）；上一写者 Codex 已停止，未并行写入
- 当前阶段：G0、G1 均已通过；S2 进行中，UI-001（路由、首页、主题）完成
- 未提交改动：交接时以 `git status --short` 复核
- 主要文件：`apps/trainer/src/app/`（router/theme/storage/App）、`apps/trainer/src/pages/`、`apps/trainer/src/ui/`、`apps/trainer/src/curriculum/`
- 最近测试：`npm run typecheck` PASS；`npm test` 7 文件/96 测试 PASS；`npm run build` PASS；`npm run verify:ui` 12 项浏览器断言 PASS
- 浏览器证据：`docs/evidence/s2-home-light.png`、`s2-home-dark.png`、`s2-lesson.png`、`s2-settings.png`（S1 三张仍保留）
- 验证方式：`npm run build` → `npm run preview --workspace @xiaohe/trainer` → `npm run verify:ui`（默认 `http://127.0.0.1:4174/`，可用 `VERIFY_URL` 覆盖）
- 审批边界：S2 可自主推进；到 G2（可实际练习的版本）必须等待用户验收
- 下一最小行动：UI-002，练习页的键盘提示与混合训练；随后 UI-003 接入真实 IME
- 已知限制：仅按键模式；无 IndexedDB/复习/CPM；Windows、PWA、屏幕阅读器未验证
- 回滚风险：路由与主题改动无数据迁移；不要用 `git reset --hard`，如需撤销按提交普通 revert
