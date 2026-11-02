# 所有开发 Agent 的统一约束（Codex + WorkBuddy International）

这是仓库级协作协议，必须在每个 Agent 会话开始时读取。它优先于临时 Agent 自行创造的产品方案；与用户最新明确指示冲突时先说明并寻求批准，不得静默修改已确认需求。

## 一、唯一事实来源

1. `DECISIONS.md` 的 42 个已确认 ID 和 `decisions.json` 是不可擅自更改的决策清单。
2. `REQUIREMENTS.md` / `CURRICULUM.md` 描述产品行为与课程规则，`ARCHITECTURE.md` 记录建议架构，`AGENT_COORDINATOR.md` 记录协调器目标。
3. `docs/PROGRESS.md`/`TASKS.md`/`HANDOFF.md` 是开发中**实际生成并维护**的进度，不得伪造已执行结果。
4. 本地检测优先于猜测；外部接口以当前安装版本为准，相关来源见 `TECH_VERIFICATION.md`。

## 二、任务执行准则

- 开始前：`pwd; git status --short; git log -1 --oneline`，检查现有文件、测试、未完成任务及阻塞项。若仓库未初始化，只在授权工作目录内安全初始化。
- 每个任务：先定范围与测试 → 实现 → 自动化/实际验证 → 复核 git diff → 小粒度提交 → 更新进度与可恢复 checkpoint。
- 不需要为普通技术问题频繁提问；可自主修复 bug、优化代码、补充测试；重大架构/破坏性迁移/改变 LEARN 决策或费用权限边界必须暂停审批。
- 任何关卡交付需附真实可运行程序、测试报告、已知问题、Git HEAD、用户验收动作与结果；用户未批准不得越过关键验收点。
- 两个 Agent 必须使用同一个 Git 仓库，但同一工作树只能有一个写者；不能交叉操作。交接必须完整保存可执行上下文。

## 三、权限与费用

- 项目及必要构建目录最小写权限；禁止未经批准访问无关个人文件、其他项目、修改 OS 设置或 sudo。
- 只使用用户既有授权；不能新增付费 API、购买额度、启用隐式按量付费，也不能通过高危 `bypassPermissions` 逃避授权。
- 禁止获取、打印、提交密钥/登录令牌；不能把个人文本/学习记录上传外部服务。
- 不做 KeySpell VIP 内容抓取、绕过门槛、复制受保护源码/文案/图像。学习器原创课程与 UI，遵守第三方依赖许可证。

## 四、质量闸门

- 真实浏览器 IME 组合输入、双拼字码、零声母、多音字、CPM、IndexedDB、Service Worker、备份迁移等必须按 `TEST_ACCEPTANCE.md` 验证。
- 结果只允许 `PASS / FAIL / NOT_RUN / BLOCKED / SIMULATED_ONLY`；缺机器/认证/接口时如实标记，不可把 mock 算真实验收。
- 优先真实用户体验，不允许 UI 只有静态占位、计分是硬编码或图表展示伪造统计。
- 记录做过哪些检查，报告运行命令、退出状态、截图或日志路径（不包含凭据）。

## 五、Agent 接力

- 主 Agent Codex，备用 **WorkBuddy International**，不是 ChatGPT Work。
- 自动交接能力验证前，不得因为存在 `codebuddy` 命令就断言能代理 WorkBuddy International。
- 接手先读 `docs/HANDOFF.md`、`docs/TASKS.md`、`docs/PROGRESS.md`、Git 现场；完成的任务不可重新实现。
- 状态不一致/存在两个写入者/未知额度或权限风险：暂停并报告，不允许强行接手。

## 六、建议开发文档格式

`docs/TASKS.md`：ID、需求 ID、前置条件、状态、负责人、下一动作、测试、提交；
`docs/PROGRESS.md`：最近完成、当前阶段、下一步、风险、Git HEAD、时间；
`docs/HANDOFF.md`：当前 Agent、已停止的旧 Agent、未提交改动、文件列表、最新测试、阻塞原因、下一最小行动；
`docs/TEST_REPORT.md`：真实执行清单、结果/环境/证据。
