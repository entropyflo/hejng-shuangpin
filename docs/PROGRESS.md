# 项目进度

更新时间：2026-11-02 22:23（Asia/Shanghai）

## 最近完成

- 冻结规格包校验通过并建立 Git 基线 `e72fa38`。
- 完成 S0 本机环境、Codex/CodeBuddy 候选接口探测。
- 建立 npm workspace 与可构建的 React/TypeScript PWA 技术骨架。
- 类型检查、1 项骨架单测、生产构建、HTTP 浏览器加载和依赖审计通过。
- 建立 42 项需求追踪矩阵、架构决策、任务、测试和交接文档。
- G0 已获用户批准；用户确认 WorkBuddy International 在本项目中即 CodeBuddy CLI。
- SCH-001 已完成：确定性声韵编码、完整键位数据、四个公开金样和有类型的拒绝策略；来源记录见 `SCHEME_SOURCES.md`。

## 当前阶段

- S0/G0：完成并通过。
- S1/SCH-001：完成；SCH-002 进行中。
- WorkBuddy International：基础非交互接口已验证；自动接力、受限写入与恢复仍为 S5 `NOT_RUN`。

## 下一步

执行 SCH-002：实现零声母、`ü/v`、声调与拼音正字法正规化，覆盖 SCH-T02。

## 风险

- CodeBuddy CLI 身份已由用户确认，但自动接力的最小权限、单写锁和恢复尚未验证。
- S0 Service Worker 只是骨架；离线安装、缓存升级、数据迁移尚未验证。
- Windows、真实 IME、PWA 安装均未执行。

## Git

- 规格基线：`e72fa38`
- 当前 S0 checkpoint：以本文所在提交为准。
