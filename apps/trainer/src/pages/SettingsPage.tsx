import { useState } from "react";
import {
  CORRECTION_LABEL,
  HINT_LABEL,
  INPUT_LABEL,
  readCorrectionMode,
  readHintMode,
  readInputMode,
  writeCorrectionMode,
  writeHintMode,
  writeInputMode,
  type CorrectionMode,
  type HintMode,
  type InputMode,
} from "../app/settings";
import { THEME_LABEL, type ThemePreference } from "../app/theme";
import { usePreferences } from "../app/preferences";
import { useThemeState } from "../app/theme-context";
import { ReadingCorrection } from "../ui/ReadingCorrection";

const THEME_OPTIONS: ThemePreference[] = ["light", "dark", "system"];
const HINT_OPTIONS: HintMode[] = ["always", "auto", "hidden"];
const CORRECTION_OPTIONS: CorrectionMode[] = ["auto", "strict", "continuous"];
const INPUT_OPTIONS: InputMode[] = ["key", "ime"];

export function SettingsPage() {
  const { preference, resolved, setPreference } = useThemeState();
  const [hintMode, setHintMode] = useState(() => readHintMode(window.localStorage));
  const [correctionMode, setCorrectionMode] = useState(() => readCorrectionMode(window.localStorage));
  const [inputMode, setInputMode] = useState(() => readInputMode(window.localStorage));
  const { motion, sound, fingering, setMotion, setSound, setFingering } = usePreferences();

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

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">设置</p>
        <h1 className="page-title">外观与练习</h1>
        <p className="lede">主题、提示与多音字修正都保存在本机浏览器，不上传服务器。</p>
      </header>

      <section className="panel" aria-labelledby="theme-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">外观</p>
            <h2 id="theme-title">主题</h2>
          </div>
          <p className="panel-note">当前实际显示：{resolved === "dark" ? "深色" : "浅色"}。</p>
        </div>

        <div className="filter-row" role="group" aria-label="主题选择">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={preference === option ? "chip is-active" : "chip"}
              aria-pressed={preference === option}
              onClick={() => setPreference(option)}
            >
              {THEME_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

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
            <h2 id="experience-title">动画、音效与指法</h2>
          </div>
          <p className="panel-note">三项都可独立关闭；关闭动画会同时停用键盘闪烁等过渡效果。</p>
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
            className={fingering ? "chip is-active" : "chip"}
            aria-pressed={fingering}
            onClick={() => setFingering(!fingering)}
          >
            指法提示：{fingering ? "开" : "关"}
          </button>
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
          <p className="panel-note">导出、导入与清空全部数据属于 S4；当前只保存主题、提示、纠错与多音字修正。</p>
        </div>
      </section>
    </>
  );
}
