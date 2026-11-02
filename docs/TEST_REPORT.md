# 阶段 S0 测试与人工验收报告

执行日期：2026-11-02（Asia/Shanghai）
OS：macOS / arm64
Git 基线：`e72fa38`
可运行工件：`apps/trainer/dist/`，本地预览 `http://127.0.0.1:4173/`

## 已执行

| 检查 | 命令/方法 | 结果 | 证据摘要 |
|---|---|---|---|
| 规格完整性 | `shasum -a 256 -c CHECKSUMS.sha256` | PASS | 13 个受校验文件全部 OK |
| 环境 | `codex/codebuddy/node/npm/git --version` | PASS | Codex 0.166.0；CodeBuddy 2.179.0；Node 22.22.3；npm 10.9.8；Git 2.54.0 |
| COORD-T01 Codex 冒烟 | 隔离临时 Git 仓库，`codex ... exec --ephemeral --json --sandbox read-only` | PASS | exit 0；事件含 `thread.started`、`turn.started`、`item.completed`、`turn.completed`；仅返回 `CODEX_S0_OK` |
| CodeBuddy CLI 基础调用 | `codebuddy -p --no-session-persistence --tools "" --output-format stream-json --max-turns 1` | PASS | exit 0；流式 JSON；未调用工具；本次 CLI 报告费用 0；结合用户接口身份确认作为 COORD-T02 证据 |
| COORD-T02 WorkBuddy International | CodeBuddy CLI 实际无工具调用 + 用户接口身份确认 | PASS | exit 0、流式 JSON、费用 0；用户于 2026-11-02 明确确认本项目中的 WorkBuddy International 即 CodeBuddy CLI |
| 类型检查 | `npm run typecheck` | PASS | exit 0 |
| 单元测试 | `npm test` | PASS | 1 文件、1 测试通过 |
| 生产构建 | `npm run build` | PASS | exit 0；Vite 17 modules；输出 HTML/CSS/JS、Manifest、SW、图标 |
| 依赖审计 | `npm audit --json` | PASS | 0 漏洞；此前插件链 10 个告警已通过移除该依赖清零 |
| 原型 HTTP | `curl --head /` 与读取 Manifest | PASS | 首页 HTTP 200；Manifest 内容可读 |
| 浏览器原型 | Codex in-app browser 打开本地预览 | PASS | 标题、主要入口与 7 天路径均可见；预览标签已保留 |

## 首次失败与修复

- `typecheck/build` 首轮因 Vite 配置类型不包含 Vitest `test` 字段而 FAIL；改用 `vitest/config` 后两项 PASS。
- 受限沙箱首次无法监听 `127.0.0.1:4173`；经用户批准后在最小本机 loopback 权限下启动并验证。
- `vite-plugin-pwa@2.0.0` 首次审计为 8 moderate / 2 low；改用自有最小 SW 后审计 PASS（0）。

## 尚未执行

- PWA-T01～T03：NOT_RUN（S0 只验证骨架构建与浏览器加载；不声称安装/断网/升级通过）。
- SCH/CUR/INP/UI/REV/STAT/DATA/PKG：NOT_RUN（对应阶段尚未开始）。
- Windows、真实 macOS/Windows IME：NOT_RUN。
- COORD-T03、T04 及完整故障注入：NOT_RUN（接口身份已确认，但真实自动接力尚未实现）。

## G0 人工验收

- 状态：`PASS`
- 用户确认：2026-11-02 明确“通过 G0”，并澄清 WorkBuddy International 即 CodeBuddy CLI，也允许调用桌面应用。
- 下一最小任务：SCH-001，小鹤官方键位核验与金样单测。

## S1 / SCH-001 增量

执行日期：2026-11-02（Asia/Shanghai）

| 测试 | 结果 | 证据 |
|---|---|---|
| SCH-T01 声母与完整韵母键位 | PASS | `flypy.test.ts` 锁定普通声母、`zh/ch/sh` 和完整韵母表；与小鹤官网、Apple 布局、Rime 规则和文本键位表交叉 |
| SCH-T03 公开样例 | PASS | `shuang→ul`、`pin→pb`、`zhong→vs`、`wen→wf` |
| 未知规则安全失败 | PASS | 零声母在 SCH-002 前抛 `ZERO_INITIAL_NOT_IMPLEMENTED`；未知声母/韵母抛有类型错误 |
| 自动化回归 | PASS | `npm run typecheck` exit 0；`npm test` 2 文件/12 测试 PASS；`npm run build` exit 0 |

SCH-001 不包含零声母与完整拼音正规化；这些项目保持 `NOT_RUN` 并进入 SCH-002。

## S1 / SCH-002 增量

执行日期：2026-11-02（Asia/Shanghai）

| 测试 | 结果 | 证据 |
|---|---|---|
| SCH-T02 十二个零声母 | PASS | `a/o/e` 重复、七个双字母保持全拼、`ang→ah`、`eng→eg`；带调样例覆盖 |
| `ü/v/u:` 正规化 | PASS | `nǚ→nv`、`lve→lt`，声调符号和尾部声调数字被规范移除 |
| `j/q/x/y` 拼写规则 | PASS | `ju→jv`、`que→qt`、`xuan→xr`、`yun→yy`，内部显式保留 `ü` |
| 完整韵母拼写 | PASS | `iou/uei/uen→iu/ui/un` |
| 非法零声母 | PASS | 非十二项输入抛 `UNSUPPORTED_ZERO_INITIAL` |
| 自动化回归 | PASS | `npm test` 2 文件/42 测试 PASS；此前同一变更的 typecheck/build 均 exit 0 |

## S1 / SCH-003 增量

执行日期：2026-11-02（Asia/Shanghai）

| 测试 | 结果 | 证据 |
|---|---|---|
| SCH-T04 上下文多音词 | PASS | `银行/行走/重庆/重要/音乐` 词级读音与双拼码全部通过 |
| 单字歧义 | PASS | `行/重/乐` 保留候选、不自动选定；未知字不猜测 |
| 位置级人工修正 | PASS | 修正优先于词典，绑定 `textId + textVersion + span`，重复生成一致 |
| 修正导出导入 | PASS | schemaVersion 1 往返一致，错误版本被拒绝 |
| 仓储重新实例化 | SIMULATED_ONLY | 内存 Storage 适配器模拟重新打开后可恢复；真实浏览器 localStorage 尚未接 UI |
| 首轮自动化 | FAIL | 3 个断言把“属性不存在”误写为“属性值 undefined”；领域结果正确，测试已修正 |
| 修复后回归 | PASS | `npm run typecheck` exit 0；`npm test` 3 文件/58 测试 PASS；`npm run build` exit 0 |

## S1 / CUR-001～CUR-002 增量

执行日期：2026-11-02（Asia/Shanghai）
Git 基线：`7d1aa98`（本次提交前）

| 测试 | 结果 | 证据 |
|---|---|---|
| CUR-T01 七天课程结构 | PASS | 7 天全部 `locked: false`；每天固定“导学/演示/实操/小测/混合”五步；七天合计覆盖五种题型 |
| CUR-T02 分层原创题库 | PASS | 单字 12、双字词 8、多字词 5、短句 4、段落 1、速度 3；每题含读音、双拼码、解释、错误提示与知识点 |
| CUR-T02b 键位与零声母覆盖 | PASS | 23 个声母、34 个展示韵母、12 个零声母均有例题；26 个字母键全部出现 |
| CUR-T03 一致性筛查 | PASS | `inspectCurriculum` 对正常题库返回空数组；注入重复 ID、错码、缺题、读音数量不符、未知读音、未知知识点、重复文本、非法字符、未覆盖知识点共 9 类坏题均被识别 |
| CUR-T04 题库 JSON Schema | PASS | `z.toJSONSchema` 导出 draft-2020-12，含 `contentVersion`/`text-typing`，可 JSON 序列化 |
| CUR-T05 全量回归 | PASS | `npm run typecheck` exit 0；`npm test` 4 文件/75 测试 PASS；`npm run build` exit 0 |

说明：本轮仅做领域层与内容校验，未接入真实浏览器 IME，因此不声称任何输入法或 UI 验收通过。JSON Schema 为构建期生成并随代码导出，未引入 `ajv` 等运行时校验依赖。

## S1 / G1 准备：验证页真实浏览器检查

执行日期：2026-11-02（Asia/Shanghai）
被测工件：`npm run build` 产物，经 `vite preview` 在 `http://127.0.0.1:4174/` 提供
浏览器：Playwright 驱动本机缓存 Chromium（Chrome for Testing 151.0.7922.34，headless）
命令：`node scripts/verify-s1-ui.mjs`（可用 `VERIFY_URL` 覆盖地址，`PLAYWRIGHT_CHROMIUM_PATH` 覆盖浏览器路径）

| 检查 | 结果 | 证据 |
|---|---|---|
| 页面标题与首屏 | PASS | 标题为“鹤径 · 小鹤双拼学习器”；统计显示 7 天 / 151 道 / 100 个知识点 |
| 按键模式正确作答 | PASS | 第 1 天第 1 题“韵母 a”按物理键 <kbd>A</kbd> 后显示“正确” |
| 错误反馈与答案揭示 | PASS | 输入错误显示“还不对”，点击“显示答案”给出正确码 `o` 与规则解释 |
| 键位映射图 | PASS | 26 个字母键全部渲染；V 键同时显示 `zh` 与 `ui`；零声母表 12 行 |
| 歧义字改读音 | PASS | 文本“行”显示“有歧义”，选择 `hang` 后读音为 hang、编码 `hh` |
| localStorage 持久化 | PASS | 刷新页面后重新输入“行”，仍为 hang / hh，计数保持 1 条 |
| 清除修正 | PASS | 点击“清除全部修正”后计数回到 0 条 |
| 控制台 | PASS | 0 条 console error / pageerror |
| 截图 | PASS | `docs/evidence/s1-ui-verify.png`、`s1-keyboard-verify.png`、`s1-readings-verify.png` |

合计 11 项浏览器断言通过。该检查证明页面可交互且修正可持久化，**不等同** G1 人工验收通过；G1 仍需用户按 `TEST_ACCEPTANCE.md` 逐项确认。

尚未执行：真实系统输入法（IME）组合输入、Windows、PWA 安装与断网。以上均为 `NOT_RUN`，不计入通过。

## G1 人工验收

- 状态：`PASS`
- 用户确认：2026-11-02 22:47 回复“通过”。
- 验收对象：S1 验证页（七天课程练习、26 键映射图、多音字修正与 localStorage 持久化）及 `docs/evidence/` 中的三张浏览器截图。
- 自动化前置证据：`npm run typecheck` exit 0；`npm test` 5 文件/84 测试 PASS；`npm run build` exit 0；`npm run verify:ui` 11 项断言 PASS。
- 边界说明：用户未逐项复述操作细节，本报告只记录“已确认通过”这一事实，不替用户补写未执行的具体步骤。
- 下一步：S2 / UI-001（首页、路由与浅色/深色/跟随系统主题）。

## S2 / UI-001 首页、路由与主题

执行日期：2026-11-02（Asia/Shanghai）
被测工件：`npm run build` 产物，`http://127.0.0.1:4174/`
命令：`npm run verify:ui`（`scripts/verify-ui.mjs`，取代 S1 阶段的 `verify-s1-ui.mjs`）

| 检查 | 结果 | 证据 |
|---|---|---|
| 首页统计与冷启动 | PASS | 7 天 / 151 道 / 100 个知识点；“上次学习”为“还没有记录” |
| 首页 → 课时 → 作答 | PASS | 点击“从第 1 天开始”进入 `/lesson/day-1`，韵母 a 判定正确 |
| 浏览器后退 | PASS | `pushState` + `popstate` 正常回退到 `/home`，并显示“上次学习 第 1 天” |
| 课程列表 | PASS | `/course` 列出 7 天 |
| 键位页 | PASS | `/keyboard` 渲染 26 键与 12 行零声母 |
| 深色主题持久化 | PASS | 选择“深色”后 `data-theme=dark`，刷新后仍为深色且下拉保持 |
| 浅色主题 | PASS | 切回浅色后 `data-theme=light`，截图对比正常 |
| 自由训练抽题 | PASS | `seed 1` 抽 20 题；“换一批”到 `seed 2`；难度筛选重置 seed |
| 多音字修正持久化 | PASS | `行 → hang / hh`，刷新后仍生效，可清除 |
| 404 | PASS | `/nope` 显示“没有这个页面”，可返回首页 |
| 控制台 | PASS | 0 条 error / pageerror |
| 截图 | PASS | `s2-home-light.png`、`s2-home-dark.png`、`s2-lesson.png`、`s2-settings.png` |

单元测试新增：路由解析 6 项、主题偏好 4 项、上次学习记录 3 项；全量 `npm test` 7 文件 / 96 测试 PASS，`npm run typecheck` 与 `npm run build` 均 exit 0。

尚未执行：真实系统 IME 组合输入、Windows、PWA 安装/断网、屏幕阅读器实测。

## S2 / UI-002 键盘提示与纠错模式

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm run verify:ui`（18 项断言），`npm test`（8 文件 / 109 测试）

| 检查 | 结果 | 证据 |
|---|---|---|
| 屏幕键盘提示 | PASS | 自动模式首题显示，高亮下一个键 `A` |
| 提示方式持久化 | PASS | 始终显示 / 自动 / 隐藏三档写入 localStorage，切换后练习页生效 |
| 严格纠错锁定 | PASS | 答错后“下一题”禁用，提示“严格纠错已开启” |
| 答错闪正确键 | PASS | 隐藏提示时仍短暂出现键盘并高亮正确键（1.2 秒） |
| 严格纠错解锁 | PASS | 按对 `A` 后“下一题”恢复可用 |
| 自动提示弱化 | PASS | 连对 3 题后第 4 题不再显示键盘；答错重置连对 |
| 连续纠错不阻塞 | PASS | 词句题答错后仍可进入下一题 |
| 速度挑战计时 | PASS | 开始后倒计时到 59 秒；提前结束显示“用时 1 秒 / 正确字数 5 / 正确率 100%” |
| 回归 | PASS | `npm run typecheck`、`npm run build` 均 exit 0；控制台 0 错误 |

单元测试新增：提示方式 4 项、纠错方式 4 项、键盘提示序列 4 项、测速前缀比对 1 项。
速度挑战只统计本次用时与正确字数，CPM 定义、星级与历史记录仍属 S3，未在此处伪造。

尚未执行：真实系统 IME、Windows、PWA 安装/断网。

## S2 / UI-003 按键 / 输入法双模式

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm run verify:ui`（21 项断言），`npm test`（9 文件 / 119 测试）

| 检查 | 结果 | 证据 |
|---|---|---|
| 模式切换 | PASS | 词句题出现“按键模式 / 输入法模式”切换，选择后立即生效并写入 localStorage |
| 组合中不判定 | PASS | 合成 `compositionstart` + `input(isComposing: true)` 后显示“正在组合输入，未提交不判定” |
| 提交后判定 | PASS | `compositionend` 提交“中国”后显示“已提交 2 字 / 正确 2 字 / 正确率 100%” |
| 完成反馈 | PASS | 与目标完全一致时出现“已完成”，并说明删除/撤销会实时更新 |
| 刷新保持 | PASS | 重新加载后仍为输入法模式 |
| 切回按键模式 | PASS | 输入框切回双拼码输入，IME 文本框消失 |
| 粘贴策略 | PASS（单元） | `sanitizePracticeText` 过滤拉丁字母与换行、保留汉字与允许标点、按长度截断 |
| 回归 | PASS | typecheck / build exit 0；控制台 0 错误 |

**真实性声明**：IME 检查使用浏览器合成事件，结果为 `SIMULATED_ONLY`。真实系统输入法（macOS/Windows 拼音、候选词替换、自动选词、撤销）**尚未人工验收**，不能据此声称 IME 已通过。

尚未执行：真实系统 IME、Windows、PWA 安装/断网。

## S2 / UI-004 专注、快捷键、指法与动画

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm run verify:ui`（27 项断言），`npm test`（9 文件 / 123 测试）

| 检查 | 结果 | 证据 |
|---|---|---|
| 动画开关 | PASS | 关闭后 `data-motion=off`，刷新仍保持，可重新开启 |
| 指法提示 | PASS | 开启后屏幕键盘每个键显示推荐手指（左小指 / 右食指等） |
| 专注模式 | PASS | 按 `F` 顶栏与页脚隐藏、出现“退出专注（Esc）”，按 `Esc` 恢复 |
| 快捷键帮助 | PASS | `?` 打开对话框，`Esc` 关闭 |
| 数字跳转 | PASS | 按 `3` 进入 `/lesson/day-3` |
| 输入保护 | PASS | 在作答框输入 `f` 不触发专注模式 |
| 回归 | PASS | typecheck / build exit 0；控制台 0 错误 |

单元测试新增：开关读写 2 项、指法映射 2 项；全量 123 测试通过。
**限制**：音效开关只验证状态持久化，未做听感验收；指法分区为通用 QWERTY 建议，不是医疗或 ergonomics 结论。

## S2 阶段小结与 G2 待办

- 已完成：UI-001 路由/首页/主题、UI-002 提示/纠错/测速、UI-003 按键/输入法双模式、UI-004 专注/快捷键/指法/动画。
- 自动化证据：`npm test` 123 项；`npm run verify:ui` 27 项浏览器断言；`npm run typecheck`、`npm run build` 均 exit 0。
- **G2 必须由用户人工完成**：用真实系统输入法完成一课（含候选词替换、删除、撤销），并在 macOS 上确认按键模式与输入法模式都可用。
- 未执行：Windows、PWA 安装/断网、屏幕阅读器。

## G2 人工验收

- 状态：`PASS`
- 用户确认：2026-11-02 23:18 回复“通过”。
- 验收对象：S2 完整版本（路由与首页、七天课程、按键/输入法双模式、提示与纠错、速度挑战、专注与快捷键、主题）。
- 自动化前置证据：`npm test` 9 文件/123 测试 PASS；`npm run verify:ui` 27 项断言 PASS；typecheck/build exit 0。
- 边界说明：用户未逐项复述真实输入法操作细节，本报告只记录“已确认通过”，不替用户补写未执行步骤；IME 合成事件证据仍标注为 `SIMULATED_ONLY`。
- 下一步：S3 / DAT-001 数据层与 STA-001 CPM 原始事件。

## S3 / DAT-001 + STA-001 数据层、CPM 与会话结算

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm test`（12 文件 / 144 测试），`npm run verify:ui`（30 项断言）

| 检查 | 结果 | 证据 |
|---|---|---|
| 数据模型与仓储 | PASS | `Attempt` / `PracticeSession` / `MasteryRecord`；Dexie 三表与内存仓储行为一致 |
| 作答落库 | PASS | 每次提交写入 attempts，并按知识点更新掌握度与下次到期时间 |
| 会话结算 | PASS | 完成 day-1 七题后显示“题数 7 / 正确 7 / 100% / ★★★” |
| 统计页真实数据 | PASS | 总览（会话 1、作答 15、正确率 80%）、分题型表、最近会话表均来自本机记录 |
| IndexedDB 持久化 | PASS | 刷新统计页后记录仍在 |
| CPM | PASS | 仅速度挑战计算；本轮无速度会话，显示“—”而非伪造数字 |
| 回归 | PASS | typecheck / build exit 0；控制台 0 错误 |

**发现并修复的缺陷**：反向记忆题此前只有选项、没有提交按钮，用户无法作答。已补“检查”按钮，并由端到端断言覆盖。

**说明**：`DAT-001` 只完成 v1 表结构，尚无历史版本迁移；`DAT-002` 备份导入事务仍未实现。统计页目前是表格，热力图与曲线属于 `REV-003` / `STA-003`。

## S3 / REV-001～003 复习队列、今日计划、错题与热力图

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm test`（13 文件 / 155 测试），`npm run verify:ui`（34 项断言）

| 检查 | 结果 | 证据 |
|---|---|---|
| 复习题生成 | PASS | 按到期时间排序、每知识点一题、去重、上限 15 |
| 到期队列页面 | PASS | 注入 1 条到期记录后显示“1 个到期知识点 · 1 题”，题目与知识点一致 |
| 首页今日计划 | PASS | 无到期时“新课 + 混合”；有到期时优先“复习 1 个到期知识点” |
| 错题本 | PASS | 按错误次数聚合，显示“韵母 a”2 次、“词语 中国”1 次，可回到对应课时 |
| 键位热力图 | PASS | 26 键按正确率着色，空白键显示“—”；点击进入 `Q 键专项` |
| 键位专项 | PASS | `/practice/key/q` 只抽与该键相关的题目，可返回全部练习 |
| 回归 | PASS | typecheck / build exit 0；控制台 0 错误 |

**测试方法说明**：复习队列的到期记录通过 IndexedDB 测试夹具注入，而不是等待真实时间流逝；这能验证查询与出题链路，但不等于跨天复习体验已验证。

**限制**：热力图只统计键位认知题的 `expected` 键，不推断词句题涉及的键；复习队列上限 15 题为当前默认值。

## S3 / STA-002～003 全拼对比与历史曲线

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm test`（15 文件 / 167 测试），`npm run verify:ui`（37 项断言）

| 检查 | 结果 | 证据 |
|---|---|---|
| 对比流程 | PASS | 先小鹤、再全拼，两次测速后显示“小鹤 CPM / 全拼 CPM / 提升” |
| 对比持久化 | PASS | 写入 `comparisons` 表，刷新后历史仍在 |
| Dexie v2 迁移 | PASS | 在已有 v1 数据库上直接新增 `comparisons` 表，旧记录未丢失（同一次浏览器会话内验证） |
| 趋势图 | PASS | 正确率折线按会话顺序渲染；单点时绘制圆点而不是空白 |
| 空状态 | PASS | 没有 CPM 记录时显示“CPM：还没有数据”，不画假线 |
| 回归 | PASS | typecheck / build exit 0；控制台 0 错误 |

**必须说明**：自动化里的“小鹤 232 / 全拼 233”是用同一路径填入文本得到的，只能证明对比与保存链路可用，**不能证明真实双拼比全拼快**。真实对比需要人工分别用两种输入法测速，属 G3 人工验收项。

## S3 阶段小结与 G3 待办

- 已完成：数据层、CPM/星级、会话结算、复习队列、今日计划、错题本、键位热力图、键位专项、全拼对比、趋势图。
- 自动化证据：167 单测；37 项浏览器断言；typecheck/build 通过。
- **G3 必须由用户人工完成**：连续使用数天形成真实复习排程；用真实小鹤与全拼各测一段；检查热力图与错题是否符合体感。
- 未执行：Windows、PWA 安装/断网、屏幕阅读器。

## G3 人工验收

- 状态：`PASS`
- 用户确认：2026-11-02 23:33 回复“通过”。
- 验收对象：S3 完整版本（复习队列、今日计划、错题本、键位热力图、全拼对比、趋势图、星级与 CPM）。
- 自动化前置证据：`npm test` 15 文件/167 测试 PASS；`npm run verify:ui` 37 项断言 PASS；typecheck/build exit 0。
- 边界说明：用户未逐项复述跨天复习与真实双输入法对比细节；本报告只记录“已确认通过”，不替用户补写未执行步骤。
- 下一步：S4 / PWA-001 离线缓存与更新提示。

## S4 / PWA-001 + DAT-002 离线与备份

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm test`（16 文件 / 175 测试），`npm run verify:ui`（41 项断言）

| 检查 | 结果 | 证据 |
|---|---|---|
| Service Worker 生成 | PASS | 构建期扫描 `dist`，写入带内容版本号的 `sw.js` 与完整预缓存列表 |
| 离线刷新 | PASS | `context.setOffline(true)` 后刷新首页仍渲染，导航与课时页可用 |
| 更新提示 | PASS | 首次加载不显示“新版本”横幅（避免误报）；等待新 worker 激活后提示 |
| 备份导出 | PASS | 下载 JSON，含 `schemaVersion: 2`、计数与 8 位校验和 |
| 备份校验 | PASS（单元） | 篡改数据、版本不符、数量不一致、缺少列表、坏 JSON 均被拒绝 |
| 清空数据 | PASS | 统计页回到空状态 |
| 导入恢复 | PASS | 清空后导入备份，会话记录恢复（Dexie 事务整体替换） |
| 启动服务 | PASS | `node scripts/serve-dist.mjs 4199`：`/`、`/sw.js`、`/lesson/day-1` 均 200 |

**未执行**：真实 PWA 安装（浏览器安装弹窗）、关闭本地服务后从桌面图标启动、Windows 启动脚本、签名 `.app`/`.exe` 打包。这些属 G4 人工验收，不能用 headless 结果代替。

## S4 阶段小结与 G4 待办

- 已完成：PWA 预缓存与离线、更新提示、备份导出/校验/事务导入、macOS/Windows 启动脚本与静态服务、打包文档。
- 自动化证据：175 单测；41 项浏览器断言；typecheck/build 通过。
- **G4 必须由用户人工完成**：Chrome 安装 PWA → 断网使用 → 关闭本地服务后从应用图标启动 → 导出备份后导入确认恢复。
- 未执行：Windows 真机、签名安装包、屏幕阅读器。

## G4 人工验收

- 状态：`PASS`
- 用户确认：2026-11-02 23:41 回复“通过”。
- 验收对象：S4 离线版本（PWA 预缓存、断网使用、备份导出/校验/事务导入、启动脚本）。
- 自动化前置证据：`npm test` 16 文件/175 测试 PASS；`npm run verify:ui` 41 项断言 PASS（含真实断网刷新与备份恢复）。
- 边界说明：PWA 安装弹窗、桌面图标启动、Windows 脚本与签名安装包未在自动化中验证；本报告只记录用户确认通过，不替用户补写未执行步骤。
- 下一步：S5 / ORG-001～003 协调器状态机、单写锁与故障策略。

## S5 / ORG-001～006 协调器内核

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm run test --workspace @xiaohe/coordinator`（5 文件 / 33 测试）

| 检查 | 结果 | 证据 |
|---|---|---|
| COORD-T07 单写锁 | PASS（模拟） | 二次获取被拒；超时锁、死进程锁可接管；非持有者不能释放 |
| 状态原子恢复 | PASS（模拟） | 临时文件 + rename；损坏文件回退初始状态；历史最多 60 条 |
| COORD-T05 故障分类与退避 | PASS（模拟） | 额度/网络/测试/认证/未知分类；网络 500ms→1s→2s，超限暂停 |
| COORD-T03 模拟额度耗尽接力 | PASS（模拟） | Codex 报额度耗尽 → 自动切换 WorkBuddy 并成功；历史含 `handoff-to-workbuddy` |
| 双方额度耗尽 | PASS（模拟） | 达到最大尝试次数后进入 `blocked` |
| 用户暂停 | PASS | 暂停后 `run` 拒绝执行并提示“不会自动复工” |
| COORD-T11 控制台安全 | PASS | 仅回环监听；无 token POST 返回 401；外部 Origin 返回 403；未知路径 404 |
| CLI 冒烟 | PASS | `status/run/pause/resume/console` 均正常；默认 dry-run，`--execute` 才调用真实 CLI |

**未执行 / 阻塞**：
- COORD-T04 真实额度耗尽事件：`NOT_RUN`。没有真实触发，不能声称自动接力在真实环境成立。
- 真实 `codex` / `codebuddy` 调用：未执行，避免在未获明确同意时消耗订阅额度；适配器仅完成参数配置。
- ORG-007 系统重启后的后台恢复：`NOT_RUN`，当前只保证状态文件原子写入与暂停语义。

## S5 小结与 G5 待办

- 已完成：单写锁、原子状态机、故障分类与退避、模拟接力、CLI、回环控制台（Origin + token）。
- 未完成：系统重启恢复、真实 Agent 调用与真实额度耗尽接力。
- **G5 不能仅凭模拟通过**：`TEST_ACCEPTANCE.md` 明确 COORD-T04 未发生时应标 `NOT_RUN`，因此真实自动接力仍为阻塞项。

## S5 / 真实额度耗尽与自动接力（COORD-T03 / T04）

执行时间：2026-11-02 23:47～23:49（Asia/Shanghai）
环境：macOS arm64；`codex-cli 0.166.0`；`codebuddy 2.179.0`
沙箱：临时 Git 目录，`--sandbox read-only`、`--ephemeral`，提示只输出固定字符串且不得读写文件

| 步骤 | 结果 | 证据（已脱敏） |
|---|---|---|
| 第 1 次真实 codex 调用 | FAIL（预期） | exit 1，输出 “You’ve hit your usage limit … try again at Nov 3rd, 2026 1:52 AM”；`classifyFailure` 判定 `quota` |
| 第 1 次接力 | FAIL（环境问题） | codebuddy 报 `Failed to start server. Is port 60698 in use?`；60698 是 WorkBuddy 应用注入的 `CODEBUDDY_SERVICE_PROXY_URL` 端口 |
| 修复 | PASS | 适配器启动 codebuddy 时移除 `CODEBUDDY_SERVICE_PROXY_URL`，并支持显式 `--port`；新增 2 项参数单测 |
| 第 2 次真实接力 | PASS | 事件序列 `run-started → failure-quota → handoff-to-workbuddy → run-succeeded`；phase `done`，耗时约 29 秒 |
| 文件影响 | 无 | 临时目录只有 `.git` 与 README，内容未变 |

**结论**：`COORD-T03` 与 `COORD-T04` 首次获得真实证据（不是模拟），自动接力在真实额度耗尽下可用。真实 CLI 输出与提示均未写入仓库，仅保留脱敏摘要。

**仍需人工/后续验证**：COORD-T06（杀进程/断电恢复）、T09（未授权安装/sudo 被 OS 拒绝）、T10（费用与高危权限提示）、T12（工作区不一致/旧 Agent 存活），以及 ORG-007 系统重启恢复。

## 产品补齐：关卡状态、自定义文本、学习天数、插回与加权混合

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm test --workspace @xiaohe/trainer`（20 文件 / 193 测试），`npm run verify:ui`（45 项断言）

| 需求 | 实现 | 验证 |
|---|---|---|
| LEARN-018 关卡状态与星级 | 课程页与首页显示“未练/已练/已完成”、最佳星级、最近一次正确率；做满全部题才算完成 | 完成 day-1 后课程页显示“已完成 ★★★” |
| LEARN-009 自定义文本 | `/texts` 支持新建、命名、编辑、删除；过滤拉丁字母与换行；输入法模式练习；随备份导出 | 保存后刷新仍在，练习可完成，备份 `counts.texts ≥ 1` |
| LEARN-010 学习天数 / XP | 首页显示学习天数与 XP（正确作答 ×2 + 会话 ×10） | 首页统计出现“学习天数 / XP” |
| LEARN-006 答错当轮插回 | 答错后按 2–5 题间隔插回队列，同一题只插一次 | day-2 首题答错后显示“第 1 / 11 题” |
| LEARN-005/007 混合训练加权 | `/mixed` 按答错次数、正确率、慢反应加权抽题，可切随机，seed 可重现 | 薄弱加权/随机切换均 20 题 |

**限制说明**：
- 自定义文本只提供输入法模式练习，不生成双拼码；离线词典尚不足以覆盖任意汉字。
- XP 公式为项目自定义，未与任何外部标准对齐。
- 混合训练权重基于作答历史，不是严格的掌握度模型。

**回归**：typecheck / build exit 0；控制台 0 错误；备份 schema 升级到 3，仍可读取 v2 备份（texts 视为空）。

## UI 修订（用户反馈 2026-11-03）

| 反馈 | 修改 | 验证 |
|---|---|---|
| 背景改成常规白色 | 浅色主题改为纯白背景，去掉米色渐变与暖色光晕；卡片白底 + 细边框 | `getComputedStyle(body).backgroundColor === rgb(255,255,255)` |
| 进入答题页可直接输入，回车确认、空格下一题 | 输入框自动聚焦；Enter 提交；反馈出现后 Space 进入下一题并保持聚焦；文本框/输入法框内不拦截 | 端到端：不点鼠标输入 `a` → Enter → 正确 → Space 切到下一题且仍聚焦 |
| 移除“本课结构” | 课时页删除五步结构面板，直接进入练习 | 页面中 `本课结构` 文本数量为 0 |
| 删除指法提示 | 移除指法映射、设置开关、键盘指法标签及相关测试 | 设置页仅剩“动画与音效”；键盘无指法文字 |
| 七天路径改竖列 | 首页路径改为单列纵向卡片 | 前两张卡片 x 坐标一致、第二张 y 更大 |

回归：193 单测；45 项浏览器断言；typecheck/build 通过。截图：`docs/evidence/s5-home.png`、`s5-lesson.png`、`s5-settings.png`。
