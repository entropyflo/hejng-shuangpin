# 小鹤方案来源与核验记录

核验日期：2026-11-02。这里只记录规则事实与来源，不复制第三方课程、图片或题库。

## 主来源

- 小鹤官网：<https://flypy.cc/>
- 官网明确：双拼是声母与韵母的压缩表达；两个字母构成一个音；页面提供官方“双拼键位图”和“零声母”说明。
- 官网键位图是视觉资源，程序实现不直接打包该图片；本项目将图中事实转录为自有数据并用测试锁定。

## 文本交叉来源

- ShuangPin 键位说明：<https://shuangpin.app/layout/>
- 该页以文本列出 Q～M 的复合声母/韵母映射，并提供：`shuang→ul`、`pin→pb`、`zhong→vs`、`wen→wf`。
- 角色：交叉核对和机器可测试样例，不替代小鹤官网的方案权威性。

## 实现与平台交叉来源

- Rime 官方双拼方案：<https://github.com/rime/rime-double-pinyin/blob/master/double_pinyin_flypy.schema.yaml>
- 该方案的 `speller.algebra` 是可执行规则，逐项给出 `iu→Q`、`ei→W`、`uan→R`、`[uv]e→T`、`sh/ch/zh→U/I/V` 以及其余韵母映射；与本项目数据逐项一致。
- Apple 中文输入方式使用手册：<https://support.apple.com/zh-cn/guide/chinese-input-method/cimc29a772a9/mac>
- Apple 官方说明每种双拼布局定义字母与声韵映射，并将“小鹤”列为独立内置布局、展示对应键盘图。它用于确认平台实现身份，不作为可复制课程素材。

## SCH-001 边界

- 已锁定：普通声母原键、`zh/ch/sh→v/i/u`、复韵母键位、四个公开样例、未知规则拒绝策略。
- `a/o/e/i/u/ü` 保留原键；数据层同时表示 `ü` 与常见 ASCII 记法 `v`，但拼音正规化尚未在本任务实现。
- 未在 SCH-001 声称完成：零声母、`ü/v` 拼写正规化、`j/q/x` 后省略两点、声调移除与完整拼音切分。这些属于 SCH-002。
- 原则：无法由当前规则确定的音节抛出有类型的错误，不猜测或静默生成编码。
