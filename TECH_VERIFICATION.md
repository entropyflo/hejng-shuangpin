# 技术可行性与必须验证事项（2026-11-02）

本文件区分**产品目标、官方文档支持的能力与用户机器上尚未验证的能力**。不得将文档例子写成已经测试成功。

## 1. 已查询的公共资料

| 来源 | 可支持的结论 | 不可推出的结论 |
|---|---|---|
| [小鹤官方](https://flypy.cc/) | 双拼声韵关系、官方键位图和零声母概念 | 不等于所有演示 UI 中的映射均准确；仍需校验各零声母细则 |
| [ShuangPin 键位文本](https://shuangpin.app/layout/) | 辅助建立可测试的小鹤映射样例 | 非官方规范，不能取代官方核对 |
| [MDN PWA 安装](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) | PWA 安装需 localhost/HTTPS 与 manifest；各浏览器支持不同 | 不保证所有 Safari/Windows/Mac 版本安装过程一致 |
| [MDN 离线运行](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation) | Service Worker 缓存可支持离线，后台不会永久运行 | 不能把 Service Worker 用作本机 Agent 常驻协调器 |
| [Codex 非交互官方说明](https://learn.chatgpt.com/docs/non-interactive-mode) | `codex exec`，JSONL 事件、沙箱与恢复机制在公开文档中存在 | 不能保证用户机器安装版本、认证类型、额度错误具体码与文档一致 |
| [CodeBuddy Code CLI Headless](https://www.codebuddy.ai/docs/cli/headless) | `codebuddy -p` 可非交互运行，文档对权限条件有说明 | **不能证明 WorkBuddy International 桌面应用一定能通过该 CLI 控制** |
| [CodeBuddy Code CLI Reference](https://www.codebuddy.ai/docs/cli/cli-reference) | CLI 有机器可读输出/权限选项和会话继续选项 | 不能直接推断本地 `codebuddy` 的授权与 WorkBuddy International 额度共享 |
| [WorkBuddy 介绍](https://www.codebuddy.ai/docs/zh/workbuddy/Overview) | WorkBuddy 是桌面 Agent 工作台 | 不代表有稳定公开 CLI 或受控的非交互 API |
| [WorkBuddy 项目配置](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Project) | WorkBuddy 可读取 `.codebuddy/` 与 `AGENTS.md` 等项目约定 | 不能证明其任务可以完全自动由外部 CLI 无确认触发 |

## 2. 阶段 0 — 用户机器先验证

**不要跳过以下步骤。只读检查无需更改环境：**

```sh
command -v codex || true
codex --version
codex exec --help
command -v codebuddy || true
codebuddy --version
codebuddy --help
command -v workbuddy || true
command -v node || true
command -v git || true
git status --short  # 确认工作目录是否为仓库
```

命令只是探测建议。`codebuddy` 与 `workbuddy` 是否存在、是不是国际站授权、与 WorkBuddy International 是什么关系，必须通过已登录程序、官方帮助和**低风险实际集成测试**验证，不得猜。只读取版本/帮助，不得输出 token、auth.json 或账号密钥。

**Codex 接口验证**：在临时测试仓库执行最小无副作用非交互任务，记录退出码、stdout/stderr、JSONL schema、会话恢复行为；是否能可靠识别配额耗尽以及是否能安全复用用户订阅认证。不得为了测试额度耗尽故意大量消耗额度。额度耗尽分类先用回放的真实脱敏日志 + 人工可触发 mock，再等真实事件出现后验收。

**WorkBuddy International 接口验证**：需要发现一个能在**现有授权与最小权限**下被协调器触发的正式、受支持接口；可编程启动、获得实际完成/错误状态、恢复上下文，并实测一条安全改动。若只有 CodeBuddy Code CLI 支持 headless，须确认这个 CLI 就是用户许可的 WorkBuddy International 接入方式，**禁止默默替换**。

## 3. 风险/决策矩阵

| 风险 | 预案 | 状态 |
|---|---|---|
| WorkBuddy International 与 CodeBuddy Code 的身份/额度/接口不一致 | 优先实测接口与账户边界；无法证明则阻塞自动切换功能 | 未验证 |
| `-y` / bypassPermissions 可能放开危险命令 | 不直接采用高危全权限模式；优先外层沙箱 + 允许清单，无法隔离则停止自动化 | 严格限制 |
| Codex 额度错误格式变化 | 退出码、日志和机器可读事件多重识别；不能识别时归类 UNKNOWN_PAUSE | 待集成 |
| 电脑休眠导致协调器中止 | 恢复唤醒后重检检查点；不承诺休眠时继续执行 | 已知限制 |
| 项目间文件误修改 | 操作系统权限/沙箱/单写锁 + git diff 检查 | 必须实现 |
| 浏览器清缓存丢学习记录 | 自动本地存储 + 用户显式备份 + 提醒 | 必须实现 |
| 多音字或零声母错码 | 官方规则复核、金样测试、题目冲突剔除 | 必须实现 |
| Safari/Edge 发行/兼容差异 | 真机支持矩阵，不具备设备则标“未验证” | 待验收 |
| Git 不存在 | 在用户指定项目目录内安全 `git init`，不得强行覆盖已有仓库 | 需检测 |
| 专用协调器自身编写耗费巨大 | PWA 里程碑独立交付；协调器能力不应阻断学习器开发 | 范围隔离 |

## 4. 不得采取的“捷径”

- 不得启用自动充值、按量付费 API、未经授权的模型或第三方代理。
- 不得将非交互工具的 `bypassPermissions` / `danger-full-access` 作为默认方案；也不得通过进程环境变量绕过高危命令确认。
- 不得泄露、转存、提交用户账号登录令牌或 API 密钥。
- 不得把 `WorkBuddy International` 用 `ChatGPT Work` 替代，或把 `CodeBuddy Code` 作为同一工具来宣称已接力成功。
- 不得通过穷举调用耗光 Codex 额度来验证异常检测。
- 不得编造 Windows 测试、真实交接事件、联网权限、订阅状态的验证结果。

## 5. 能力判定标准

`VERIFIED`：真机执行、日志与 Git 状态可核对；`DOCUMENTED_ONLY`：仅官方文档说明；`NOT_SUPPORTED`：明确不可用；`UNKNOWN`：未验证。所有交接和控制台都必须显示其中一种，不得混合。
