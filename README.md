# 鹤径 · 小鹤双拼学习器

**规格：** Spec 1.0（42 项决策冻结于 2026-11-02）
**状态：** 学习器已实现并通过自动化验证；本地 Agent 协调器内核完成，真实接力已验证，G5 尚余恢复类测试。

## 这是什么

一个离线优先的小鹤双拼学习 PWA，以及一个可选的本地 Agent 协调器。

- **学习器**：七天课程、151 道原创题、按键/输入法双模式、提示与纠错、复习队列、错题与热力图、CPM 对比、PWA 离线、备份导入。
- **协调器**：Codex 为主、额度耗尽自动切换到 WorkBuddy；本地 CLI 与回环控制台，默认 dry-run。

## 快速开始

```sh
npm install
npm run build
npm run preview --workspace @xiaohe/trainer   # 打开 http://127.0.0.1:4174/
```

macOS 也可双击 `release/start-macos.command`（127.0.0.1:4173），Windows 用 `release/start-windows.bat`。
安装为 PWA、离线使用与备份说明见 `docs/PACKAGING.md`。

## 测试

```sh
npm run test:all     # 学习器 193 项 + 协调器 35 项
npm run verify:ui    # 45 项浏览器断言（需先 build 并启动 preview）
npm run coord -- status
```

## 当前边界

- 自定义文本目前只支持输入法模式练习（离线词典不足以覆盖任意汉字）。
- 真实系统输入法、Windows 启动脚本、屏幕阅读器、签名安装包未在自动化中验证。
- 协调器的真实额度接力已实测通过；`COORD-T06/T09/T10/T12` 与系统重启恢复仍未完成。

进度与交接见 `docs/PROGRESS.md`、`docs/HANDOFF.md`、`docs/TEST_REPORT.md`。

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
