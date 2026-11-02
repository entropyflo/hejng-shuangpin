import { useEffect, useState, type ReactNode } from "react";
import { NAV_ITEMS, navigate, useRoute } from "../app/router";
import { usePreferences } from "../app/preferences";
import { useServiceWorkerUpdate } from "../app/swUpdate";
import { Link } from "./Link";
import { Icon } from "./Icon";

const SHORTCUTS = [
  { keys: "?", action: "打开或关闭本帮助" },
  { keys: "F", action: "进入或退出专注模式" },
  { keys: "Esc", action: "退出专注模式或关闭帮助" },
  { keys: "1 – 7", action: "跳到第 N 天课程" },
  { keys: "Tab / Enter", action: "正常焦点移动与激活，不被拦截" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const route = useRoute();
  const { focus, setFocus, toggleFocus } = usePreferences();
  const [helpOpen, setHelpOpen] = useState(false);
  const { updateReady, reload } = useServiceWorkerUpdate();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        if (helpOpen) setHelpOpen(false);
        else if (focus) setFocus(false);
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (event.key === "?") {
        event.preventDefault();
        setHelpOpen((current) => !current);
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFocus();
        return;
      }

      if (/^[1-7]$/u.test(event.key)) {
        event.preventDefault();
        navigate(`/lesson/day-${event.key}`);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focus, helpOpen, setFocus, toggleFocus]);

  return (
    <div className={focus ? "app-shell is-focus" : "app-shell"}>
      <a className="skip-link" href="#content">
        跳到主要内容
      </a>
      <header className="topbar">
        <Link to="/home" className="brand">
          <span className="brand-mark" aria-hidden="true">鹤</span>
          <span className="brand-type">鹤径<small>小鹤双拼</small></span>
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

        <div className="topbar-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={toggleFocus}
            aria-pressed={focus}
            aria-label="专注模式"
            title="专注模式（F）"
          >
            <Icon name="focus" />
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setHelpOpen(true)}
            aria-haspopup="dialog"
            aria-label="快捷键"
            title="快捷键（?）"
          >
            <Icon name="help" />
          </button>
          <Link to="/settings" className="ghost-button" aria-label="设置" title="设置">
            <Icon name="settings" />
          </Link>
        </div>
      </header>

      {focus ? (
        <button type="button" className="focus-exit" onClick={() => setFocus(false)}>
          退出专注（Esc）
        </button>
      ) : null}

      <main id="content" className={`page page-${route.name}`}>
        {children}
      </main>

      {updateReady ? (
        <div className="update-banner" role="status">
          <span>新版本已就绪，刷新后生效。</span>
          <button type="button" className="secondary" onClick={reload}>
            刷新
          </button>
        </div>
      ) : null}

      <footer className="page-footer">
        <p>
          课程、题库与讲解均为本项目原创。学习记录、复习排程与统计只保存在本机浏览器，不上传服务器。
        </p>
      </footer>

      {helpOpen ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setHelpOpen(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="shortcuts-title">键盘快捷键</h2>
            <dl className="shortcut-list">
              {SHORTCUTS.map((item) => (
                <div key={item.keys}>
                  <dt>
                    <kbd>{item.keys}</kbd>
                  </dt>
                  <dd>{item.action}</dd>
                </div>
              ))}
            </dl>
            <p className="muted small">在输入框、文本域或下拉框内不会触发这些快捷键。</p>
            <button type="button" className="secondary" onClick={() => setHelpOpen(false)}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
