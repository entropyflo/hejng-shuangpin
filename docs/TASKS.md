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
| REV-001～003 | 006～008 | DAT-001 | TODO | WorkBuddy | 复习排程引擎、今日计划、错题与热力图 | REV 全组 | — |
| STA-001 | 008, 025 | DAT-001 | DONE | WorkBuddy | CPM 只用于速度挑战，不换算键位练习 | metrics 单测 + 会话 CPM | S3 数据层提交 |
| STA-002～003 | 008, 026 | STA-001 | TODO | WorkBuddy | 全拼对比与历史图表 | STAT-T02, T03 | — |
| DAT-001 | 015, 029 | G2 | DONE | WorkBuddy | 表结构变更时必须加 Dexie 迁移 | 30 项浏览器断言含 IndexedDB 刷新 | S3 数据层提交 |
| DAT-002, PWA-001, PKG-001 | 014, 015, 027, 029 | DAT-001 | TODO | WorkBuddy | 备份导入事务、离线安装与发行包 | DATA/PWA/PKG 全组 | — |
| ORG-001～007 | 032～041 | ENV-003 或获批阻塞设计 | TODO | Codex | S5；接口不可用时保持阻塞 | COORD 全组 | — |
| QA-001～005 | 031～033 | 各阶段 | TODO | Codex + 用户 | 随阶段执行 | TEST_ACCEPTANCE | — |
