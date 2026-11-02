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

## ADR-004：协调器接口能力边界

- 状态：部分验证 / WorkBuddy 自动接口阻塞
- Codex CLI：0.166.0，`exec --json` 只读无工具冒烟成功，可获得 JSONL 事件和退出码。
- CodeBuddy Code CLI：2.179.0，无工具、无会话持久化冒烟成功并报告费用 0；只证明该 CLI 能运行。
- WorkBuddy AI：桌面应用 5.9.4 存在并可见，但未发现正式、受支持的外部启动、完成状态、恢复上下文接口。
- 决定：不得把 CodeBuddy Code CLI 自动视为 WorkBuddy International 适配器；ORG-004/005 保持 `BLOCKED_CAPABILITY`。也不采用高危跳过权限或桌面应用当前的广泛权限模式作为无人值守基础。

## ADR-005：G0 后先做知识引擎

- 状态：待用户 G0 批准
- 决定：下一阶段只进入 SCH-001，先核验小鹤官方键位与零声母金样；在 G1 前不铺开课程 UI。
- 理由：符合“准确教学优先”，避免把可疑示意映射固化进题库和界面。
