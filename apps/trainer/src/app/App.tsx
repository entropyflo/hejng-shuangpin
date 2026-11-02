import { prototypeStatus } from "../prototypeStatus";

const courseDays = [
  "双拼概念与基础键位",
  "复合韵母",
  "鼻韵母",
  "声母、零声母与拼写规则",
  "单字与短词",
  "真实输入法连打",
  "句段测速与全拼对比",
];

export function App() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">S0 可行性原型 · 课程始终全部开放</p>
        <h1>沿着鹤径，练成双拼</h1>
        <p className="lede">
          这是技术骨架，不是已完成课程。S1 将先交付经核验的小鹤字码引擎和金样测试。
        </p>
        <div className="actions" aria-label="主要入口">
          <button type="button">查看今日建议</button>
          <button type="button" className="secondary">自由训练</button>
        </div>
      </header>

      <section aria-labelledby="course-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">七天路径</p>
            <h2 id="course-title">从认键到真实中文输入</h2>
          </div>
          <span className="status">{prototypeStatus.label}</span>
        </div>
        <ol className="course-grid">
          {courseDays.map((title, index) => (
            <li key={title}>
              <span>第 {index + 1} 天</span>
              <strong>{title}</strong>
              <small>可直接进入 · 内容待阶段实现与验收</small>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
