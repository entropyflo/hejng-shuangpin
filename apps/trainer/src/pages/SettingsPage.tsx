import { useState } from "react";
import {
  CORRECTION_LABEL,
  HINT_LABEL,
  INPUT_LABEL,
  MAPPING_LABEL,
  readCorrectionMode,
  readHintMode,
  readAutoAdvance,
  readInputMode,
  readMappingMode,
  readMnemonic,
  writeCorrectionMode,
  writeHintMode,
  writeAutoAdvance,
  writeInputMode,
  writeMappingMode,
  writeMnemonic,
  type CorrectionMode,
  type HintMode,
  type InputMode,
  type MappingMode,
} from "../app/settings";
import { usePreferences } from "../app/preferences";
import { createBackup, parseBackup } from "../data/backup";
import { getRepository } from "../data";
import { ReadingCorrection } from "../ui/ReadingCorrection";

const HINT_OPTIONS: HintMode[] = ["always", "auto", "hidden"];
const CORRECTION_OPTIONS: CorrectionMode[] = ["auto", "strict", "continuous"];
const INPUT_OPTIONS: InputMode[] = ["key", "ime"];
const MAPPING_OPTIONS: MappingMode[] = ["always", "on-press"];

export function SettingsPage() {
  const [hintMode, setHintMode] = useState(() => readHintMode(window.localStorage));
  const [correctionMode, setCorrectionMode] = useState(() => readCorrectionMode(window.localStorage));
  const [inputMode, setInputMode] = useState(() => readInputMode(window.localStorage));
  const [mappingMode, setMappingMode] = useState(() => readMappingMode(window.localStorage));
  const [autoAdvance, setAutoAdvance] = useState(() => readAutoAdvance(window.localStorage));
  const [mnemonic, setMnemonic] = useState(() => readMnemonic(window.localStorage));
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const { motion, sound, setMotion, setSound } = usePreferences();

  function changeHint(mode: HintMode) {
    setHintMode(mode);
    writeHintMode(window.localStorage, mode);
  }

  function changeCorrection(mode: CorrectionMode) {
    setCorrectionMode(mode);
    writeCorrectionMode(window.localStorage, mode);
  }

  function changeInput(mode: InputMode) {
    setInputMode(mode);
    writeInputMode(window.localStorage, mode);
  }

  function changeMapping(mode: MappingMode) {
    setMappingMode(mode);
    writeMappingMode(window.localStorage, mode);
  }

  function toggleAutoAdvance() {
    const next = !autoAdvance;
    setAutoAdvance(next);
    writeAutoAdvance(window.localStorage, next);
  }

  function toggleMnemonic() {
    const next = !mnemonic;
    setMnemonic(next);
    writeMnemonic(window.localStorage, next);
  }

  async function exportBackup() {
    try {
      const payload = createBackup(await getRepository().exportAll());
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `xiaohe-backup-${new Date(payload.exportedAt).toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setDataMessage(
        `已导出：${payload.counts.attempts} 条作答、${payload.counts.sessions} 次会话、${payload.counts.mastery} 个知识点、${payload.counts.comparisons} 次对比。`,
      );
      setDataError(null);
    } catch {
      setDataError("导出失败，请确认浏览器允许 IndexedDB。");
    }
  }

  async function importBackup(file: File) {
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setDataError(result.error);
      setDataMessage(null);
      return;
    }
    const { counts } = result.payload;
    const confirmed = window.confirm(
      `导入会覆盖当前全部数据：\n作答 ${counts.attempts} 条、会话 ${counts.sessions} 次、知识点 ${counts.mastery} 个、对比 ${counts.comparisons} 次。\n继续吗？`,
    );
    if (!confirmed) return;
    try {
      await getRepository().replaceAll(result.payload.data);
      setDataMessage(`导入完成：${counts.attempts} 条作答、${counts.sessions} 次会话。`);
      setDataError(null);
    } catch {
      setDataError("导入失败，事务已回滚，原有数据保持不变。");
    }
  }

  async function clearAllData() {
    try {
      await getRepository().clear();
      setDataMessage("已清空本机记录。");
      setDataError(null);
    } catch {
      setDataError("清空失败，请确认浏览器允许 IndexedDB。");
    } finally {
      setConfirmClear(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">设置</p>
        <h1 className="page-title">练习与数据</h1>
        <p className="lede">提示方式、练习反馈与多音字修正都保存在本机浏览器，不上传服务器。</p>
      </header>

      <section className="panel" aria-labelledby="hint-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">练习辅助</p>
            <h2 id="hint-title">键盘提示</h2>
          </div>
          <p className="panel-note">
            屏幕键盘会高亮下一个要按的键。即使提示已隐藏，答错时也会短暂闪一下正确键。
          </p>
        </div>

        <div className="filter-row" role="group" aria-label="提示方式">
          {HINT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={hintMode === option ? "chip is-active" : "chip"}
              aria-pressed={hintMode === option}
              onClick={() => changeHint(option)}
            >
              {HINT_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="correction-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">练习辅助</p>
            <h2 id="correction-title">纠错方式</h2>
          </div>
          <p className="panel-note">
            严格模式答错必须按对才能继续；连续模式记录错误但不阻塞，适合词句与测速。
          </p>
        </div>

        <div className="filter-row" role="group" aria-label="纠错方式">
          {CORRECTION_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={correctionMode === option ? "chip is-active" : "chip"}
              aria-pressed={correctionMode === option}
              onClick={() => changeCorrection(option)}
            >
              {CORRECTION_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="experience-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">体验</p>
            <h2 id="experience-title">动画与音效</h2>
          </div>
          <p className="panel-note">两项都可独立关闭；关闭动画会同时停用键盘闪烁等过渡效果。</p>
        </div>

        <div className="filter-row" role="group" aria-label="体验开关">
          <button
            type="button"
            className={motion ? "chip is-active" : "chip"}
            aria-pressed={motion}
            onClick={() => setMotion(!motion)}
          >
            动画：{motion ? "开" : "关"}
          </button>
          <button
            type="button"
            className={sound ? "chip is-active" : "chip"}
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
          >
            音效：{sound ? "开" : "关"}
          </button>
          <button
            type="button"
            className={autoAdvance ? "chip is-active" : "chip"}
            aria-pressed={autoAdvance}
            onClick={toggleAutoAdvance}
          >
            答对自动切题：{autoAdvance ? "开" : "关"}
          </button>
          <button
            type="button"
            className={mnemonic ? "chip is-active" : "chip"}
            aria-pressed={mnemonic}
            onClick={toggleMnemonic}
          >
            口诀提示：{mnemonic ? "开" : "关"}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="mapping-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">练习辅助</p>
            <h2 id="mapping-title">键位映射显示</h2>
          </div>
          <p className="panel-note">
            控制答案框下方键位图的声母与韵母。“按下后显示”会保留已经按过的键，不会再次隐藏。
          </p>
        </div>

        <div className="filter-row" role="group" aria-label="键位映射显示">
          {MAPPING_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={mappingMode === option ? "chip is-active" : "chip"}
              aria-pressed={mappingMode === option}
              onClick={() => changeMapping(option)}
            >
              {MAPPING_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="input-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">练习辅助</p>
            <h2 id="input-title">输入方式</h2>
          </div>
          <p className="panel-note">
            按键模式判定物理键与双拼码；输入法模式只判定已提交的汉字，组合中的候选不计分。
          </p>
        </div>

        <div className="filter-row" role="group" aria-label="输入方式">
          {INPUT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={inputMode === option ? "chip is-active" : "chip"}
              aria-pressed={inputMode === option}
              onClick={() => changeInput(option)}
            >
              {INPUT_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

      <ReadingCorrection />

      <section className="panel" aria-labelledby="data-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">数据</p>
            <h2 id="data-title">备份与重置</h2>
          </div>
          <p className="panel-note">
            备份包含作答、会话、掌握度与对比记录；导入前会校验校验和，并用事务整体替换。
          </p>
        </div>

        <div className="speed-actions">
          <button type="button" className="primary" onClick={() => void exportBackup()}>
            导出备份
          </button>
          <label className="secondary file-label">
            导入备份
            <input
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importBackup(file);
                event.target.value = "";
              }}
            />
          </label>
          {confirmClear ? (
            <>
              <button type="button" className="primary" onClick={() => void clearAllData()}>
                确认清空
              </button>
              <button type="button" className="secondary" onClick={() => setConfirmClear(false)}>
                取消
              </button>
            </>
          ) : (
            <button type="button" className="secondary" onClick={() => setConfirmClear(true)}>
              清空全部数据
            </button>
          )}
        </div>

        {dataError ? <p className="error-text">{dataError}</p> : null}
        {dataMessage ? <p className="muted small">{dataMessage}</p> : null}
      </section>
    </>
  );
}
