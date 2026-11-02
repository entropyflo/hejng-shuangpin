import { THEME_LABEL, type ThemePreference } from "../app/theme";
import { useThemeState } from "../app/theme-context";
import { ReadingCorrection } from "../ui/ReadingCorrection";

const THEME_OPTIONS: ThemePreference[] = ["light", "dark", "system"];

export function SettingsPage() {
  const { preference, resolved, setPreference } = useThemeState();

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">设置</p>
        <h1 className="page-title">外观与数据</h1>
        <p className="lede">主题和多音字修正都保存在本机浏览器，不上传服务器。</p>
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

      <ReadingCorrection />

      <section className="panel" aria-labelledby="data-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">数据</p>
            <h2 id="data-title">备份与重置</h2>
          </div>
          <p className="panel-note">导出、导入与清空全部数据属于 S4；当前只保存主题与多音字修正两项本地数据。</p>
        </div>
      </section>
    </>
  );
}
