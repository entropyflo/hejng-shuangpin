# 可恢复交接

更新时间：2026-11-02 23:54（Asia/Shanghai）

- 当前 Agent：WorkBuddy AI（本次会话）；上一写者 Codex 已停止，未并行写入
- 当前阶段：G0～G4 通过；S5 的 ORG-001～006 完成，真实额度接力已验证；ORG-007 与 G5 剩余测试未完成
- 未提交改动：交接时以 `git status --short` 复核
- 主要文件：`apps/coordinator/src/`（state/lock/policy/adapters/runtime/server/cli）
- 最近测试：trainer 16 文件/175 测试；coordinator 6 文件/35 测试；typecheck/build/verify:ui 均通过
- 真实事件证据：`docs/TEST_REPORT.md` 的 “S5 / 真实额度耗尽与自动接力” 段（已脱敏）
- 运行方式：`npm run coord -- status|run|pause|resume|console`；默认 dry-run，`--execute` 才调用真实 CLI
- 审批边界：真实 Agent 调用消耗订阅额度，必须逐次获得同意；G5 未完成 T06/T09/T10/T12 前不得声称通过
- 下一最小行动：ORG-007 系统重启恢复；随后补 T06/T09/T10/T12
- 已知限制：CodeBuddy 在应用内运行需移除 `CODEBUDDY_SERVICE_PROXY_URL` 或显式 `--port`；控制台 token 每次启动变化；Windows 未验证
- 回滚风险：协调器状态在 `runtime/`（已 gitignore）；不要用 `git reset --hard`
