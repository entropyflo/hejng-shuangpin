# Xiaohe Shuangpin Trainer — 工程交付包

**版本：** Spec 1.0 · **冻结日期：** 2026-11-02 · **状态：** 42 项需求决策已确认，尚未进入软件开发。

本包是可直接用于实际实施的产品与工程文档，**不是已开发完成的软件**。产品包含两个独立系统：

1. **小鹤双拼离线学习 PWA（核心产品）**：桌面优先、纯简体中文、七天入门与长期强化、智能复习、真实输入法测速。
2. **本地 Agent 协调器（开发基础设施）**：Codex 为主，WorkBuddy International 在额度耗尽后自动接力；本地 Web 控制台 + CLI；严格权限、费用、验收边界。

## 开始使用（推荐）

1. 解压工程交付包至希望创建项目的目录。先阅读 `DECISIONS.md` 和 `REQUIREMENTS.md`，确认范围。
2. **使用 Codex：** 打开 Codex，选择该项目目录，直接粘贴 `CODEX_PROMPT.md` 的全部内容；要求先做阶段 0 环境与接口能力探测，再进入开发。
3. **使用 WorkBuddy International：** 让它访问相同目录并读取 `WORKBUDDY_PROMPT.md`、`AGENTS.md`、`docs/` 等交接文件。它是备用 Agent，不是 ChatGPT Work。
4. 验收遵照 `TEST_ACCEPTANCE.md`；关键节点必须人工批准后才能进入下一阶段。
5. 要求 Agent 将本规格包纳入项目仓库，持续更新项目进度与 Git 检查点，不要依赖会话记忆。

## 文档导航

| 文件 | 用途 |
|---|---|
| `DECISIONS.md` | LEARN-001 至 LEARN-042 逐项决策索引（唯一决策事实表） |
| `REQUIREMENTS.md` | 完整功能流程、数据规则、非功能约束与验收判据 |
| `ARCHITECTURE.md` | PWA 架构、数据模型、输入法与离线技术方案 |
| `CURRICULUM.md` | 七天课程原创建议、题库、键位校验与算法草案 |
| `AGENT_COORDINATOR.md` | 双 Agent 自动接力、状态机、权限、费用与故障恢复规范 |
| `AGENTS.md` | 任意 Agent 都必须遵守的共同工作守则 |
| `CODEX_PROMPT.md` | Codex 主开发任务书，可直接复制执行 |
| `WORKBUDDY_PROMPT.md` | WorkBuddy International 继续开发的任务书 |
| `DEVELOPMENT_PLAN.md` | 阶段、依赖、交接、Git 及里程碑验收 |
| `TEST_ACCEPTANCE.md` | 自动化测试矩阵、人工验收及报告模板 |
| `TECH_VERIFICATION.md` | 已查资料、未知能力、开工前必须验证的风险 |
| `decisions.json` | 42 项决策机器可读索引 |

## 不可混淆的事实

- **KeySpell 只是公开课程结构与互动风格的参考**：不得复制付费课程、源代码、文案、商标、图像，亦不得绕过 VIP 访问控制。应独立创作课程、题库与界面。
- 小鹤双拼键位、零声母规则、特殊拼写必须核对官方与可信资料。**此前交流中的视觉示意不是正确性依据**，存在可疑键位标注（例如 `C` 的韵母）；不得照抄示意制作引擎。
- **Codex CLI 有可查证的非交互接口**。WorkBuddy International（桌面工作台）和 CodeBuddy Code CLI（`codebuddy`）存在关联但不可直接认定是同一产品或可共享账号、额度、自动化接口。见 `TECH_VERIFICATION.md`。
- 用户要求“全自动接力”，是**待实现且需要真机验收的目标**，而不是已经具备的能力。若实际安装版本不支持受控的自动化接口，必须报告阻塞，不能谎称完成；不能未经用户批准用另一个账户或按量付费 API 替换。
- 用户指定 **仅现有授权额度、无未经批准新支出**。不可关闭安全沙箱或申请高危权限以达到无人值守。
- 已安装的 PWA 经完整缓存后应能断网使用；`file://` 直接双击的 HTML 不等价于可安装 PWA。桌面平台安装和离线行为须真实验证。
- **学习 PWA 在完全离线时运行**；开发期间 Codex/WorkBuddy 调用云模型可能需要网络，两者不能混为一谈。

## 交付完成定义

学习器通过教学规则、输入法兼容、离线、数据恢复、统计与 UI 验收；协调器通过受控真实 CLI 自动接力、权限/费用、崩溃恢复、双重控制台与人工关卡验收。任何因环境或供应商能力无法通过的项目必须标注未验证/阻塞；不得将测试报告或示意图冒充成软件产品。

## 后续由 Agent 建立的文件（本规格包不伪造运行状态）

`docs/PROGRESS.md`、`docs/TASKS.md`、`docs/TEST_REPORT.md`、`docs/ARCHITECTURE_DECISIONS.md`、`docs/HANDOFF.md`、`runtime/task-state.json`（运行目录不入 Git）由实际开发时创建与维护。
