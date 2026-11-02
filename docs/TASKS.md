# 开发任务

状态：`DONE` / `IN_PROGRESS` / `TODO` / `BLOCKED_CAPABILITY` / `AWAIT_HUMAN_ACCEPTANCE`。

| ID | 需求 | 前置 | 状态 | 负责人 | 下一动作 | 测试/证据 | 提交 |
|---|---|---|---|---|---|---|---|
| ENV-001 | 032, 041, 042 | 无 | DONE | Codex | 保持环境记录更新 | Git/工具版本与规格 checksum | S0 提交 |
| ENV-002 | 027, 031, 040 | ENV-001 | DONE | Codex | S1 引入依赖时复审 | build/typecheck/test/audit | S0 提交 |
| ENV-003 | 034, 035, 040, 041 | ENV-001 | DONE | Codex | S5 验证受限写入、恢复和自动接力 | `docs/TEST_REPORT.md` COORD-T02 | G0 决策提交 |
| DOC-001 | 031, 032, 033, 036, 042 | ENV-001 | DONE | Codex | 每任务更新追踪 | 本追踪矩阵与进度文档 | S0 提交 |
| PWA-S0 | 014, 020, 027, 030 | ENV-002 | DONE | Codex | S4 时完成离线实测 | 本地 build + HTTP 200 + 浏览器可见 | S0 提交 |
| G0 | 032, 033 | ENV-001～003, PWA-S0 | DONE | 用户 | 已于 2026-11-02 批准 | `docs/TEST_REPORT.md` | G0 决策提交 |
| VER-001 | 003, 021, 022 | SCH-003, CUR-002 | DONE | WorkBuddy | G1 反馈后迭代 | 11 项浏览器断言；3 张截图 | S1 验证页提交 |
| G1 | 001, 002, 021, 022 | SCH-001～003, CUR-001～002, VER-001 | DONE | 用户 | 已通过；S2 从 UI-001 开始 | 用户 2026-11-02 22:47 确认“通过” | — |
| SCH-001 | 001, 005, 009, 021 | G0 | DONE | Codex | 规则变更时复核四层来源 | SCH-T01, SCH-T03；11 项新增测试 | SCH-001 提交 |
| SCH-002 | 001, 009, 022 | SCH-001 | DONE | Codex | 规则变更时复跑零声母与正规化金样 | SCH-T02；31 项新增测试 | SCH-002 提交 |
| SCH-003 | 009, 022 | SCH-001 | DONE | Codex | S1 验证页接入真实 localStorage | SCH-T04 PASS；SCH-T05 领域 PASS/浏览器 NOT_RUN | SCH-003 提交 |
| CUR-001 | 001, 002, 017, 019 | SCH-001 | DONE | WorkBuddy | 内容扩充时同步版本号 | CUR-T01, CUR-T02, CUR-T02b | CUR 提交 |
| CUR-002 | 005, 009 | SCH-001 | DONE | WorkBuddy | 新增题型时补充筛查规则 | CUR-T03, CUR-T04；9 类坏题注入 | CUR 提交 |
| UI-001 | 003, 010～012, 020, 028, 030 | S1/G1 | DONE | WorkBuddy | 新增页面时复用路由与主题令牌 | UI-T01, UI-T03；12 项浏览器检查 | S2 UI-001 提交 |
| UI-002 | 003, 005, 016, 018 | UI-001 | DONE | WorkBuddy | 新增题型时补提示序列与纠错映射 | 18 项浏览器断言；109 单测 | S2 UI-002 提交 |
| UI-003 | 004, 013 | UI-002 | DONE | WorkBuddy | 真实系统 IME 需人工验收 | 21 项浏览器断言（IME 为合成事件） | S2 UI-003 提交 |
| UI-004 | 012, 016, 023, 024 | UI-003 | DONE | WorkBuddy | 新页面需保持快捷键不冲突 | 27 项浏览器断言；123 单测 | S2 UI-004 提交 |
| G2 | 003, 004, 012, 013, 016, 023, 024 | UI-001～004 | DONE | 用户 | 已通过；S3 从数据层开始 | 用户 2026-11-02 23:18 确认“通过” | — |
| GAP-001 | 005, 006, 009, 010, 018 | UI-004 | DONE | WorkBuddy | 自定义文本目前仅输入法模式 | 45 项浏览器断言；198 单测 | 产品补齐提交 |
| REV-001 | 006 | DAT-001 | DONE | WorkBuddy | 新增知识点时复核索引 | 复习队列单测；到期注入断言 | S3 复习提交 |
| REV-002 | 007 | REV-001 | DONE | WorkBuddy | 计划规则变更需补测 | 今日计划单测与首页断言 | S3 复习提交 |
| REV-003 | 008 | REV-001 | DONE | WorkBuddy | 热力图目前只统计键位认知题 | 错题汇总单测；热力图跳转断言 | S3 复习提交 |
| STA-001 | 008, 025 | DAT-001 | DONE | WorkBuddy | CPM 只用于速度挑战，不换算键位练习 | metrics 单测 + 会话 CPM | S3 数据层提交 |
| STA-002 | 008, 026 | STA-001 | DONE | WorkBuddy | 真实输入法对比需人工复测 | 对比流程与保存断言 | S3 对比提交 |
| STA-003 | 008 | STA-002 | DONE | WorkBuddy | 新指标需补序列测试 | 折线点单测；趋势图断言 | S3 对比提交 |
| G3 | 006～008, 018, 025, 026 | REV-001～003, STA-001～003 | DONE | 用户 | 已通过；S4 从 PWA 与备份开始 | 用户 2026-11-02 23:33 确认“通过” | — |
| DAT-001 | 015, 029 | G2 | DONE | WorkBuddy | 表结构变更时必须加 Dexie 迁移 | 30 项浏览器断言含 IndexedDB 刷新 | S3 数据层提交 |
| PWA-001 | 014, 020 | DAT-001 | DONE | WorkBuddy | 资源变化需重新构建生成 SW | 断网刷新与路由断言 | S4 提交 |
| DAT-002 | 015, 029 | DAT-001 | DONE | WorkBuddy | 备份结构变更必须升 schemaVersion | 备份校验单测；导出/清空/导入断言 | S4 提交 |
| PKG-001 | 027 | PWA-001 | IN_PROGRESS | WorkBuddy | Windows 真机与签名安装包待做 | macOS 启动脚本与静态服务已验证；Windows NOT_RUN | S4 提交 |
| G4 | 014, 015, 027, 029 | PWA-001, DAT-002, PKG-001 | DONE | 用户 | 已通过；S5 从协调器内核开始 | 用户 2026-11-02 23:41 确认“通过” | — |
| ORG-001 | 034, 035, 040, 041 | ENV-003 | DONE | WorkBuddy | 锁文件格式变更需兼容旧版 | 单写锁 6 项测试 | S5 提交 |
| ORG-002 | 035, 036, 039 | ENV-003 | DONE | WorkBuddy | 状态字段变更需升 version | 状态机 6 项测试 | S5 提交 |
| ORG-003 | 034, 035 | ORG-001 | DONE | WorkBuddy | 输出格式变化时复核分类 | 真实 codex 调用（只读沙箱）返回额度耗尽并被正确分类 | S5 真实事件提交 |
| ORG-004 | 034, 035 | ORG-001 | DONE | WorkBuddy | 端口冲突时用 --port | 真实 codebuddy 调用成功；修复代理端口冲突 | S5 真实事件提交 |
| ORG-005 | 035, 039 | ORG-003, ORG-004 | DONE | WorkBuddy | 真实额度事件已记录 | COORD-T03/T04 真实 PASS：额度耗尽→接力→成功 | S5 真实事件提交 |
| ORG-006 | 037 | ORG-002 | DONE | WorkBuddy | 控制台功能按需扩展 | CLI 冒烟；控制台 5 项测试 | S5 提交 |
| ORG-007 | 038, 039 | ORG-002 | IN_PROGRESS | WorkBuddy | 系统重启恢复未实现 | 原子状态与暂停语义已测；重启恢复 NOT_RUN | S5 提交 |
| G5 | 032～041 | ORG-001～007 | AWAIT_HUMAN_ACCEPTANCE | 用户 | 剩余 T06/T09/T10/T12 与 ORG-007 待验 | COORD-T03/T04 真实 PASS；其余未执行 | — |
| QA-001～005 | 031～033 | 各阶段 | TODO | Codex + 用户 | 随阶段执行 | TEST_ACCEPTANCE | — |
