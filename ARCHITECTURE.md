# 技术架构方案（建议架构，允许非破坏性优化）

## 1. 物理边界

```
浏览器安装的学习 PWA  ── IndexedDB + ServiceWorker ── 本地题库/音效/课程
                  [无须开发协调器、无须网络、无须 AI API]

另一个独立进程：Agent 协调器（Node.js / Python 任取验证后锁定）
    ├─ Loopback Web 控制台 + CLI（访问控制）
    ├─ SQLite/持久化状态机、日志、Git 检查点
    ├─ Codex CLI 适配器（实际 CLI 探测）
    └─ WorkBuddy International 适配器（先验证是否提供受控可编程接口）
```

两个系统不得使用相同端口、同源路径与数据存储；学习 PWA 不得内置 Agent API 凭据。协调器的云端 Agent 可联网，**学习 PWA 断网运行**。

## 2. 前端推荐栈

优先 TypeScript + React + Vite + 测试框架（Vitest）+ Playwright + IndexedDB 包装层（如 Dexie）+ 可靠 PWA 插件或原生 Service Worker。课程/编码/复习/统计模块为独立纯函数组件。图表可用本地打包依赖，避免 CDN。具体库由 Agent 核验当前版本和许可证后确定，锁定依赖版本并记录选择依据。

目录建议：

```
apps/trainer/src/
  app/             路由、布局、主题、导航与全局状态
  scheme/          小鹤规则字典、零声母、转写器
  curriculum/      课程、题库、题目生成、评分规则
  practice/        按键检测、IME 交互、计时与纠错
  review/          错题、间隔重复、日计划
  analytics/       CPM、历史曲线、键位热力图
  data/            IndexedDB 仓储、迁移、导入导出
  ui/              可访问键盘、组件、音效与动画
  pwa/             Manifest、SW 更新、离线测试
apps/coordinator/  协调器（独立开发、单独运行）
packages/shared/   非隐私通用常量、校验 Schema
```

## 3. 事件层与 IME 交互

按键模式：`keydown` → 验证 `event.code` + 是否有 IME composition → 状态机消化输入 → 与当前期望编码比对 → 记录事件，绝不将全局按键误绑定在文字输入框中。

真实输入法：普通文本编辑框按浏览器 IME 生命周期处理，`compositionstart/update/end` 与后续 `input` 可能顺序不同；**对实际已提交字符串做差分比较**，不能在 compositionupdate 阶段评分；严格记录粘贴/撤销/退格/候选词纠错。可设计对比测速禁止或单独标记粘贴，不应通过监听用户系统级输入获取无关信息。

两种模式共享课程和题库，但速度/反应统计独立。Tab、Ctrl/Cmd 组合按键保留默认系统/可访问性行为；快捷键冲突有可替代方案。

## 4. 逻辑数据模型（建议）

```ts
type Lesson = { id:string; day:number; title:string; conceptIds:string[]; exerciseIds:string[] };
type Knowledge = { id:string; pinyin:string[]; key:string; type:'initial'|'final'|'zeroInitial' };
type Attempt = {
  id:string; lessonId?:string; exerciseId:string; mode:'raw'|'ime';
  startedAt:string; elapsedActiveMs:number; expected:string;
  committedText?:string; typedCode?:string; correct:boolean;
  firstResponseMs?:number; backspaces?:number; edits?:number; pausedMs:number;
};
type Review = { knowledgeId:string; ease:number; intervalDays:number; nextDueAt:string; errorCount:number };
type SpeedRun = { id:string; inputScheme:'fullPinyin'|'flypy'; targetVersion:string;
  deviceTag?:string; validHanChars:number; activeMs:number; cpm:number; accuracy:number; aborted:boolean };
type UserOverride = { textId:string; spanStart:number; spanEnd:number; reading:string; updatedAt:string };
type Backup = { schemaVersion:number; createdAt:string; appVersion:string; payload:unknown; checksum:string };
```

IndexedDB object stores 建议：`lessons, attempts, reviewStates, speedRuns, customTexts, readingOverrides, settings, sessionDrafts, metadata`。用索引辅助查询，日期以 ISO UTC 保存，显示层使用用户本地时区。为每种 schema 迁移写回归测试，不擅自删除数据。

## 5. CPM 的一致性细则

- 统一共享的 `measureChineseTyping` 纯函数处理全拼、小鹤测速，时间使用 `performance.now()` 计算有效区间，暂停时间剔除。
- 使用目标文本的汉字（Unicode `\p{Script=Han}`）为分子，只统计已提交、按顺序正确匹配的汉字，不计标点、不计输入框里纯拼音、不计尚在输入法候选中的字。
- 处理插入删除：以输入事件记录和最终文本对齐；必须界定错误输入后改正是否可以恢复 CPM 分子和准确率（建议：**最终正确可计 CPM，原始错误另计准确率与编辑次数**）。不可简单以最终字符串等于目标就宣布 100% 首次正确率。
- 终止/缺失时长/输入法类型不同/目标短到不能比较时显示不可比；保留原始可审计信息。

## 6. 完全离线 PWA

Manifest 含 name、short_name、icons（192/512）、start_url、display。Service Worker 使用版本化资源列表预缓存 app shell、关键课程和字典；离线首次可用状态明确告知。校验 SW 生命周期、更新提示、缓存迁移；应用可在正常安装完成后关闭本地启动服务并断网启动（目标浏览器可用时）；不能保证清理浏览器存储后仍保持离线，必须有备份提醒。

一键启动发行包可捆绑轻量 loopback 静态服务及所有已构建资源，不能强求用户装 npm。**PWA 离线安装的浏览器支持因平台不同，要测试并记录实际方式。** Chrome/Edge/Safari 的添加应用操作不必完全一致。

## 7. 数据备份

导出版本化 JSON（可选压缩）、哈希验证文件损坏；不宣称哈希可阻止蓄意篡改。`importBackup()` 应先在隔离事务/临时仓储校验并预览，只有用户确认才覆盖；保留导入前恢复点或提示先导出备份。拒绝超大文件与危险对象键（例如 `__proto__`），防止 JSON 原型污染。

导出内容：学习记录、统计、复习、课题、用户文本、读音修改、设置、构建版本；不含本机登录凭据和 Agent 协调器信息。备份提醒仅应用内，不保证浏览器关闭时推送。

## 8. 安全与可访问性

前端默认不向外发送学习数据，不加载第三方脚本/遥测，严格内容安全策略；本地路径不在页面泄露。所有按钮、卡片可键盘导航与屏幕阅读器识别，焦点清晰。键位热力图附数值和标签，不纯用颜色表达掌握度。动画尊重 prefers-reduced-motion，音效不自动高音量播放。

## 9. 权限与部署

不同于 PWA，协调器需要执行本机进程、维护 Git；必须与浏览器学习器分离。macOS 可选在明确授权后注册 `launchd` 用户服务；Windows 对应 Task Scheduler 用户权限任务；默认只监听 `127.0.0.1`，不安装可公网访问的服务。
