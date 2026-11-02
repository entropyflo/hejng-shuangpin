# 可恢复交接

更新时间：2026-11-02 23:28（Asia/Shanghai）

- 当前 Agent：WorkBuddy AI（本次会话）；上一写者 Codex 已停止，未并行写入
- 当前阶段：G0、G1、G2 通过；S3 进行中，数据层（DAT-001）与 CPM/会话结算（STA-001）完成
- 未提交改动：交接时以 `git status --short` 复核
- 主要文件：`apps/trainer/src/data/`（types/metrics/scheduler/recorder/repository/dexieRepository）、`apps/trainer/src/ui/ExerciseRunner.tsx`、`apps/trainer/src/pages/StatsPage.tsx`
- 最近测试：`npm run typecheck` PASS；`npm test` 12 文件/144 测试 PASS；`npm run build` PASS；`npm run verify:ui` 30 项浏览器断言 PASS
- 浏览器证据：`docs/evidence/s2-stats.png` 及此前 S2 截图
- 验证方式：`npm run build` → `npm run preview --workspace @xiaohe/trainer` → `npm run verify:ui`（默认 `http://127.0.0.1:4174/`，可用 `VERIFY_URL` 覆盖）
- 审批边界：S3 可自主推进；到 G3 必须等待用户验收（复习排程、热力图、星级、CPM、全拼对比）
- 下一最小行动：REV-001 把 `reviewMastery` 接入今日队列与到期查询，再做 REV-002 首页计划
- 已知限制：无 Dexie 历史迁移；备份导入（DAT-002）未做；热力图与曲线未做；真实 IME 结论以 G2 用户确认为准
- 回滚风险：IndexedDB v1 已存在用户数据，改表结构必须写迁移；不要用 `git reset --hard`，如需撤销按提交普通 revert
