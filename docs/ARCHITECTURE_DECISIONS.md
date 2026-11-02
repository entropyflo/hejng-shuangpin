# 架构决策记录

## ADR-001：npm workspace 单仓库

- 状态：S0 采用
- 决定：根目录使用 npm workspace；学习器位于 `apps/trainer`，协调器将位于 `apps/coordinator`，共享纯类型以后放 `packages/shared`。
- 理由：保持两个运行时物理隔离，同时共享 Git、锁文件和质量脚本。
- 约束：学习器不得依赖协调器或 Agent 凭据。

## ADR-002：React + Vite + TypeScript

- 状态：S0 采用
- 锁定直接版本：React 19.3.1、Vite 8.3.5、TypeScript 7.0.2、Vitest 5.0.5、Dexie 4.4.7、Zod 4.6.7。
- 依据：2026-11-02 通过 npm 官方注册表查询版本和许可证；锁文件已生成。
- 说明：S0 只建立可运行骨架，不把占位入口宣称为课程功能。

## ADR-003：自有最小 Service Worker

- 状态：S0 采用，S4 必须复审
- 决定：不使用 `vite-plugin-pwa@2.0.0`，先采用项目内 `public/sw.js` 与 Manifest。
- 理由：首次审计显示其 Workbox 构建链有 8 个 moderate、2 个 low 告警；移除后 `npm audit` 为 0。
- 限制：当前仅验证构建与在线首次加载；安装、断网、版本化资源清单和升级迁移均为 `NOT_RUN`，留到 PWA-001/S4。

## ADR-004：协调器接口身份与能力边界

- 状态：G0 更新；基础接口已验证，完整自动接力待 S5
- Codex CLI：0.166.0，`exec --json` 只读无工具冒烟成功，可获得 JSONL 事件和退出码。
- CodeBuddy Code CLI：2.179.0，无工具、无会话持久化冒烟成功并报告费用 0；只证明该 CLI 能运行。
- 用户于 2026-11-02 明确确认：本项目此前所称的 “WorkBuddy International” 就是 `CodeBuddy CLI`，也允许调用 WorkBuddy International 桌面应用。因此 CodeBuddy CLI 可作为 `WorkBuddyInternationalAdapter` 的正式候选接口。
- 边界：身份歧义已解除，但一次无工具冒烟不等于自动接力完成。受限写入、完成状态、上下文恢复、单写锁、费用与权限策略仍须在 S5 实测；不得采用高危跳过权限或桌面应用当前的广泛权限模式作为无人值守基础。

## ADR-005：G0 后先做知识引擎

- 状态：G0 已于 2026-11-02 批准
- 决定：下一阶段只进入 SCH-001，先核验小鹤官方键位与零声母金样；在 G1 前不铺开课程 UI。
- 理由：符合“准确教学优先”，避免把可疑示意映射固化进题库和界面。
