# 需求追踪矩阵

更新：2026-11-02。状态以 `docs/TASKS.md` 与实际测试报告为准；本表只定义需求到实现与测试的责任边界，不代表功能已经完成。

| 需求 | Task | 计划代码模块 | 验收项 |
|---|---|---|---|
| LEARN-001 | CUR-001 | `apps/trainer/src/curriculum/` | CUR-T01 |
| LEARN-002 | CUR-001, UI-001 | `curriculum/`, `app/` | CUR-T01 |
| LEARN-003 | UI-002 | `practice/`, `ui/` | INP-T05, UI-T02 |
| LEARN-004 | UI-003 | `practice/raw/`, `practice/ime/` | INP-T01～T03 |
| LEARN-005 | CUR-002, UI-002 | `curriculum/`, `practice/` | CUR-T03, REV-T01 |
| LEARN-006 | REV-001 | `review/` | REV-T01, REV-T02 |
| LEARN-007 | REV-002 | `review/daily-plan` | REV-T03 |
| LEARN-008 | REV-003, STA-003 | `analytics/`, `review/` | STAT-T04 |
| LEARN-009 | CUR-002, SCH-003 | `curriculum/bank`, `scheme/text` | CUR-T03, SCH-T04 |
| LEARN-010 | UI-001, UI-002 | `app/`, `practice/` | UI-T01, UI-T04 |
| LEARN-011 | UI-001 | `app/routes`, `app/home` | UI-T01 |
| LEARN-012 | UI-001, UI-004 | `app/layout`, `ui/focus` | UI-T03, UI-T04 |
| LEARN-013 | UI-003 | `practice/correction` | INP-T04, INP-T05 |
| LEARN-014 | PWA-001 | `pwa/`, `public/sw.js` | PWA-T01～T03 |
| LEARN-015 | DAT-001, DAT-002 | `data/` | DATA-T01～T03 |
| LEARN-016 | UI-004 | `ui/feedback` | UI-T03 |
| LEARN-017 | CUR-001, UI-002 | `curriculum/lessons`, `practice/` | CUR-T01, G2 人工验收 |
| LEARN-018 | STA-003 | `analytics/results` | STAT-T05 |
| LEARN-019 | UI-002 | `practice/session` | INP-T06 |
| LEARN-020 | UI-001, QA-002 | `app/layout`, E2E | UI-T04, INP-T02, INP-T03 |
| LEARN-021 | SCH-001, UI-002 | `scheme/`, `ui/keyboard` | SCH-T01, UI-T02 |
| LEARN-022 | SCH-003, DAT-001 | `scheme/readings`, `data/` | SCH-T04, SCH-T05 |
| LEARN-023 | UI-004 | `ui/fingering` | UI-T02 |
| LEARN-024 | UI-004, QA-002 | `app/shortcuts`, `ui/` | UI-T01, UI-T05 |
| LEARN-025 | STA-001 | `analytics/cpm` | STAT-T01, STAT-T02 |
| LEARN-026 | STA-002 | `analytics/compare` | STAT-T03 |
| LEARN-027 | PKG-001 | `scripts/`, `release/` | PKG-T01, PKG-T02 |
| LEARN-028 | UI-001 | `app/theme` | UI-T03 |
| LEARN-029 | DAT-001, DAT-002 | `data/`, `app/settings` | DATA-T01～T04 |
| LEARN-030 | UI-001 | `app/`, `curriculum/` | UI-T01～T05 |
| LEARN-031 | QA-001～QA-005 | `tests/`, 各模块测试 | TEST_ACCEPTANCE 全表 |
| LEARN-032 | ENV-001, QA-005 | `docs/`, Git 里程碑 | COORD-T08 |
| LEARN-033 | QA-005 | `docs/TEST_REPORT.md` | G0～G6 人工验收 |
| LEARN-034 | ENV-003, ORG-004 | `apps/coordinator/adapters/` | COORD-T01, COORD-T02 |
| LEARN-035 | ORG-003～ORG-005 | `apps/coordinator/` | COORD-T03, COORD-T04 |
| LEARN-036 | DOC-001 | `docs/ARCHITECTURE_DECISIONS.md` | Git/diff/审批审计 |
| LEARN-037 | ORG-006 | `apps/coordinator/cli`, `web` | COORD-T08, COORD-T11 |
| LEARN-038 | ORG-007 | `apps/coordinator/runtime` | COORD-T06 |
| LEARN-039 | ORG-002, ORG-005 | `apps/coordinator/state` | COORD-T05, COORD-T06 |
| LEARN-040 | ORG-002, QA-004 | `apps/coordinator/policy` | COORD-T10 |
| LEARN-041 | ORG-001, QA-004 | `apps/coordinator/lock`, `policy` | COORD-T07, COORD-T09, COORD-T12 |
| LEARN-042 | DOC-001 | 根规格与 `docs/` | 文件校验、交付清单 |
