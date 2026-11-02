import { useState } from "react";
import { CURRICULUM, KNOWLEDGE_ITEMS } from "../curriculum/content";
import { prototypeStatus } from "../prototypeStatus";
import { KeyboardMap } from "../ui/KeyboardMap";
import { LessonPractice } from "../ui/LessonPractice";
import { ReadingCorrection } from "../ui/ReadingCorrection";

const TABS = [
  { id: "course", label: "七天课程" },
  { id: "keyboard", label: "键位映射" },
  { id: "readings", label: "多音字修正" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function App() {
  const [tab, setTab] = useState<TabId>("course");

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">S1 规则与课程验证版 · 全部课程开放</p>
        <h1>沿着鹤径，练成双拼</h1>
        <p className="lede">
          编码引擎与七天原创题库已经过自动化测试。这里可以直接核验键位映射、按题练习，并修改多音字读音后保存到本机。
        </p>

        <dl className="stat-row">
          <div>
            <dt>课程</dt>
            <dd>{CURRICULUM.lessons.length} 天</dd>
          </div>
          <div>
            <dt>题目</dt>
            <dd>{CURRICULUM.exercises.length} 道</dd>
          </div>
          <div>
            <dt>知识点</dt>
            <dd>{KNOWLEDGE_ITEMS.length} 个</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>{prototypeStatus.label}</dd>
          </div>
        </dl>

        <nav className="tabs" role="tablist" aria-label="功能切换">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "tab is-active" : "tab"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "course" ? <LessonPractice /> : null}
      {tab === "keyboard" ? <KeyboardMap /> : null}
      {tab === "readings" ? <ReadingCorrection /> : null}

      <footer className="page-footer">
        <p>
          课程、题库与讲解均为本项目原创。计时测速、间隔复习、热力图与离线安装属于后续阶段，本页不会用占位数据冒充成绩。
        </p>
      </footer>
    </main>
  );
}
