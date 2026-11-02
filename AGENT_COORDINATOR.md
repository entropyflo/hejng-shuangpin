# Agent 协调器实施规格（LEARN-032～041）

> Codex 主开发；**WorkBuddy International** 额度接力。目标为全自动切换、单写者、最小权限、零新增费用。该协调器**尚未实现**，任何自动接力能力必须在目标机器真实验证。

## 1. 系统边界与启动方式

独立于学习 PWA 的本地进程，建议 `apps/coordinator/`；本机 `127.0.0.1` Web 控制台 + `agentctl`（建议名字，待开发）CLI 两入口使用同一数据库与控制 API。人工第一次启动项目任务，此后后台运行；只在明确授权后安装 `launchd` / Windows Task Scheduler 的用户级自启动与安全恢复。系统休眠时不承诺继续执行，唤醒后复核并恢复。

**启动或重新启动时先做安全检查**：加载任务状态，检查是否人为暂停、验收暂停、子进程 PID/进程树、项目锁、Git 工作树、版本号、上次 checkpoint；不能确认单写者则暂停，不能简单重新发任务。

## 2. 角色与外部适配器

- `CodexAdapter`：从已安装 CLI 探测能力，使用官方文档支持的非交互模式（版本兼容优先）；可参考 `codex exec --json --sandbox workspace-write`；不要采用 danger-full-access。
- `WorkBuddyInternationalAdapter`：**只在证实**有允许自动调用 WorkBuddy International 的、与用户授权相符的接口后启用；CodeBuddy Code 的 `codebuddy -p` 为候选但不是已确认替代品。若不能合法可靠接入，报告 BLOCKED_CAPABILITY。
- `GitCheckpoint`：记录提交 ID、分支、工作树状态、已完成/未完成的任务、可重复的恢复入口。
- `PolicyEngine`：所有子进程文件系统、网络、计费和高危操作的最小权限约束；单靠提示词不构成沙箱。
- `EventJournal`：追加式事件日志 + SQLite 任务状态事务（从记录可重建状态），敏感内容脱敏。
- `Scheduler`：每次只分配一个有写权限的 Agent，另一方待命，禁止同时操作同一工作树。

## 3. 明确的状态机

状态建议：

```
IDLE
  └─(用户 Start)→ PREFLIGHT
PREFLIGHT ──(验证通过)→ RUN_CODEX
          └─(权限/接口阻塞)→ PAUSED_BLOCKED
RUN_CODEX ──(任务完成/测试)→ VERIFY_CHECKPOINT
          ├─(明确额度耗尽)→ HANDOFF_PREPARE
          ├─(暂时网络故障)→ RETRY_BACKOFF
          ├─(危险操作/疑似计费)→ PAUSED_APPROVAL
          └─(不明故障)→ PAUSED_BLOCKED
HANDOFF_PREPARE ──(可证明唯一写者/完整状态)→ RUN_WORKBUDDY
                └─(不满足)→ PAUSED_BLOCKED
RUN_WORKBUDDY ──(任务完成/测试)→ VERIFY_CHECKPOINT
              ├─(可恢复故障)→ RETRY_BACKOFF
              └─(重大故障或额度耗尽)→ PAUSED_BLOCKED
VERIFY_CHECKPOINT ──(普通阶段通过)→ RUN_当前代理
                  ├─(关键节点)→ AWAIT_HUMAN_ACCEPTANCE
                  └─(测试未通过且有修复预算)→ RUN_当前代理
AWAIT_HUMAN_ACCEPTANCE ──(用户批准)→ PREFLIGHT/下一阶段
                       └─(驳回)→ RUN_当前代理修复
任意状态 ──(用户暂停/停止)→ PAUSED_USER / STOPPED
```

重要：**状态切换不能仅以退出码 0 判断成功**；还要检查 Git、任务断言、测试结果、结构化输出与实际已写文件。每次 `START/RESUME` 要有幂等 key 和乐观版本号；重复操作拒绝或返回同一执行结果。

## 4. Codex 额度耗尽识别与交接协议

1. 持续读取进程事件、退出码、stderr，依据**实测已确认**的配额错误模式归类 QUOTA_EXHAUSTED。未知错误不得猜成“额度不足”，不得靠反复请求烧额度。
2. 先停止 Codex 任务；等待退出与进程树清理；获得可确认的单写锁。若无法确认退出，只能暂停，**不准让 WorkBuddy 并发修改**。
3. 捕获 `git status --porcelain`, `git diff --stat`, HEAD、未跟踪文件列表、任务版本、最近测试、未完成步骤、已应用变更摘要，原子写 `docs/HANDOFF.md`。保留未提交现场并先创建适当安全 checkpoint；不能自动 `reset --hard`。
4. 调用已验证 WorkBuddy 适配器，以工作目录+文档+任务 ID 为输入，要求先复核现场与安全边界。
5. WorkBuddy 先运行只读验证/测试，接着完成**下一最小可恢复任务**，完成后提交 Git、更新任务状态和交接文件。
6. Codex 恢复可用时，只可在当前 Agent 安全完成检查点后切换；不得抢占正在执行的写入操作。

## 5. 控制台与 CLI

网页：展示实际 Agent、供应商接口能力状态、任务/阶段、正在运行的 PID、最近心跳、Git HEAD、测试摘要、异常/重试数、审批待办、日志（可过滤/脱敏），提供启动/暂停/恢复/停止/批准/驳回；禁用当前状态下不合法按钮。

CLI 目标：

```
agentctl status
agentctl logs --tail 100
agentctl start --task TASK-001
agentctl pause --reason user
agentctl resume
agentctl stop
agentctl approve --checkpoint <id>
agentctl reject --checkpoint <id> --reason "..."
agentctl doctor
```

**以上是设计命令，不是当前机器上已有 CLI。** Web 与 CLI 必须共享权限与状态策略，用户确认应记录事件来源/时间。防止浏览器跨站请求伪造（CSRF）、跨域访问和未授权同机进程滥用：绑定 loopback、校验 Origin/CSRF、启动令牌/会话认证、关键动作二次确认；不可将令牌注入到网页学习器。

## 6. 失败分类策略（实现建议，非用户最终指定数值）

| 类型 | 检测 | 处理 |
|---|---|---|
| 额度耗尽 | 已验证错误码/机器事件/错误文本 | Codex → WorkBuddy 交接；无合法目标则阻塞 |
| 网络超时 | 明确连接错误/超时 | 指数退避 30s→2m→5m，最多 3 次，之后暂停 |
| 测试失败 | test 进程有效退出/断言报告 | 最多 3 轮自主修复，同错误反复出现则暂停报告 |
| 授权失败 | 账号登录过期/权限不足 | 暂停等待用户，**不自动修改凭据** |
| 未授权费用 | 模型/插件提示额外计费 | 禁止请求、暂停等待明确批准 |
| 不明中断 | 进程消失/事件不完整 | 冻结工作树，审计后有限恢复；不明则暂停 |
| 高危文件/系统操作 | 执行沙箱拒绝、变更越界 | 立即阻断、留审计日志、等待确认 |
| 两个 Agent 均不可用 | 双方实测不可执行 | 写 checkpoint 并安全暂停 |

重试要用分类+退避+每任务预算，防无限调用和刷账。后台可采用 `launchd`/任务计划恢复但**受用户暂停状态和验收屏障约束**；不能因自启绕过审批。

## 7. 权限、费用与机密保护

- 只在用户授权的项目工作树与特定构建缓存范围内写入。Agent 进程权限由沙箱/容器/OS 限制而不仅是自然语言约束。
- 不得默认 `sudo`、危险 chmod、全盘读写、删项目外文件，禁止调用第三方付费 API/自动加购；仅使用已授权订阅，记录能力，不存储明文凭据。
- 不将登录 token、密钥、API Key、工作文件内容上传给其他无关服务。
- 任意重大架构调整、破坏性迁移、越权/额外费用、新模型授权均进入 `PAUSED_APPROVAL`。
- 准备或验收自动接力不能使用高危 CLI 绕过授权（例如 WorkBuddy 的 `-y` 危险权限模式）；若无法在受限权限下运行，则自动接力能力标记阻塞。

## 8. 持久化数据与事务处理

建议 SQLite + WAL，持久表：`tasks` `agents` `runs` `events` `checkpoints` `approvals` `retryBudgets` `leases` `capabilities`。事件均有 eventId、timestamp、taskId、phase、agent、runId、gitHead、message、classification、metadata（脱敏）；运行状态在事务内更新。使用单机排他锁（如 `flock`/原子锁文件 + SQLite lease），lease 失效不能直接判断进程消失，需 PID/进程树及文件锁双重确认。日志按容量滚动，禁止包含任何凭据。

## 9. 接力必须通过的真实验收

- 两个 Agent 均能以指定用户授权和最小沙箱执行一个 harmless test，日志能确定实际负责方。
- 在**mock 注入额度耗尽**下可以自动完成交接，且单写锁/状态迁移正确。
- 若真的发生 Codex 配额耗尽，记录经过脱敏的真实检测证据，进行一次真实接力；**在真实事件发生前只标记模拟通过，不能声称真实额度触发已通过**。
- 崩溃重启/断网/死锁/用户暂停/审批暂停时不并发、不静默跳过边界。
- Web 与 CLI 同步、所有状态来自真实事件；命令与按钮可实际使用。
- 若 WorkBuddy International 无受支持的自动化接口，协调器须将相应功能标记 `BLOCKED_CAPABILITY`，可以独立继续完成学习器 PWA，但不能将目标悄悄降级为其他 Agent。
