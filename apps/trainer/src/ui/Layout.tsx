import type { ReactNode } from "react";
import { NAV_ITEMS, useRoute } from "../app/router";
import { THEME_LABEL, type ThemePreference } from "../app/theme";
import { useThemeState } from "../app/theme-context";
import { Link } from "./Link";

const THEME_OPTIONS: ThemePreference[] = ["light", "dark", "system"];

export function Layout({ children }: { children: ReactNode }) {
  const route = useRoute();
  const { preference, setPreference } = useThemeState();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">
        跳到主要内容
      </a>
      <header className="topbar">
        <Link to="/home" className="brand">
          鹤径
          <span>小鹤双拼</span>
        </Link>

        <nav className="main-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={route.name === item.route ? "nav-link is-active" : "nav-link"}
              aria-current={route.name === item.route ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <label className="theme-select">
          <span className="visually-hidden">主题</span>
          <select
            value={preference}
            onChange={(event) => setPreference(event.target.value as ThemePreference)}
            aria-label="主题"
          >
            {THEME_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {THEME_LABEL[option]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main id="content" className="page">
        {children}
      </main>

      <footer className="page-footer">
        <p>
          课程、题库与讲解均为本项目原创。计时测速、间隔复习、热力图与离线安装属于后续阶段，本页不会用占位数据冒充成绩。
        </p>
      </footer>
    </div>
  );
}
