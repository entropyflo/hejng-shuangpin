# 可恢复交接

更新时间：2026-11-02 23:50（Asia/Shanghai）

- 当前 Agent：WorkBuddy AI（本次会话）；上一写者 Codex 已停止，未并行写入
- 当前阶段：G0～G4 通过；S5 的 ORG-001～006 完成，ORG-007 进行中；G5 因真实额度事件未发生而保持待验
- 未提交改动：交接时以 `git status --short` 复核
- 主要文件：`apps/coordinator/src/`（state/lock/policy/adapters/runtime/server/cli）、根 `package.json` 脚本
- 最近测试：trainer 16 文件/175 测试；coordinator 5 文件/33 测试；`npm run typecheck`、`npm run build`、`npm run verify:ui`（41 项）均通过
- 运行方式：`npm run coord -- status|run|pause|resume|console`；默认 dry-run，`--execute` 才调用真实 CLI
- 审批边界：真实 Agent 调用会消耗订阅额度，必须先获得用户明确同意；G5 真实接力未验证前不得声称通过
- 下一最小行动：ORG-007 系统重启恢复（状态重载 + 暂停不自动复工 + 后台常驻）；随后在获批后做一次最小真实调用
- 已知限制：真实 codex/codebuddy 参数未实跑；无系统重启恢复；控制台无鉴权持久化（每次启动新 token）；Windows 未验证
- 回滚风险：协调器状态在 `runtime/`（已 gitignore），删除即可重置；不要用 `git reset --hard`
