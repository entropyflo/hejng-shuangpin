import { useEffect, useState } from "react";
import { COMPARE_TEXTS, buildComparison, improvementPercent } from "../compare/model";
import { getRepository } from "../data";
import { computeCpm } from "../data/metrics";
import { newSessionId } from "../data/recorder";
import type { ComparisonRecord } from "../data/types";
import { SpeedChallenge } from "../ui/SpeedChallenge";

const DATE_FORMAT = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type Step = "flypy" | "quanpin" | "done";

export function ComparePage() {
  const [textId, setTextId] = useState(COMPARE_TEXTS[0].id);
  const [step, setStep] = useState<Step>("flypy");
  const [flypyCpm, setFlypyCpm] = useState<number | null>(null);
  const [quanpinCpm, setQuanpinCpm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ComparisonRecord[]>([]);

  const current = COMPARE_TEXTS.find((item) => item.id === textId) ?? COMPARE_TEXTS[0];

  async function loadHistory() {
    try {
      setHistory(await getRepository().listComparisons(10));
    } catch {
      setError("无法读取对比历史，请确认浏览器允许 IndexedDB。");
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  function reset(nextTextId = textId) {
    setTextId(nextTextId);
    setStep("flypy");
    setFlypyCpm(null);
    setQuanpinCpm(null);
    setError(null);
  }

  function handleResult(result: { correctChars: number; elapsedMs: number }) {
    const cpm = computeCpm(result.correctChars, result.elapsedMs);
    if (cpm === null) {
      setError("至少输入 1 个正确汉字并持续 1 秒以上，才能计算 CPM。");
      return;
    }
    setError(null);

    if (step === "flypy") {
      setFlypyCpm(cpm);
      setStep("quanpin");
      return;
    }

    if (step === "quanpin" && flypyCpm !== null) {
      setQuanpinCpm(cpm);
      setStep("done");
      const record = buildComparison({
        id: newSessionId(),
        textId,
        text: current.text,
        flypyCpm,
        quanpinCpm: cpm,
        at: Date.now(),
      });
      void getRepository()
        .saveComparison(record)
        .then(loadHistory)
        .catch(() => setError("对比结果未能保存到本机。"));
    }
  }

  const improvement =
    flypyCpm !== null && quanpinCpm !== null ? improvementPercent(flypyCpm, quanpinCpm) : null;

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">全拼 / 小鹤对比</p>
        <h1 className="page-title">同一段文本，各测一次</h1>
        <p className="lede">
          先用小鹤双拼测速，再用全拼测同一段文本；两次都只统计正确汉字数。输入法类型由你自己切换，本页无法核实你实际用了哪种。
        </p>
      </header>

      <section className="panel" aria-labelledby="compare-text-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">第一步</p>
            <h2 id="compare-text-title">选择文本</h2>
          </div>
          <p className="panel-note">切换文本会重新开始对比；同一文本便于横向比较。</p>
        </div>
        <div className="filter-row" role="group" aria-label="对比文本">
          {COMPARE_TEXTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={textId === item.id ? "chip is-active" : "chip"}
              aria-pressed={textId === item.id}
              onClick={() => reset(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      {step === "flypy" ? (
        <section className="panel" aria-labelledby="flypy-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">第 1 / 2 次</p>
              <h2 id="flypy-title">小鹤双拼测速</h2>
            </div>
            <p className="panel-note">限时 30 秒；提前结束按实际用时计算。</p>
          </div>
          <SpeedChallenge
            key={`${textId}-flypy`}
            text={current.text}
            durationSeconds={30}
            onResult={handleResult}
          />
        </section>
      ) : null}

      {step === "quanpin" ? (
        <section className="panel" aria-labelledby="quanpin-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">第 2 / 2 次</p>
              <h2 id="quanpin-title">全拼测速</h2>
            </div>
            <p className="panel-note">
              小鹤结果 {flypyCpm} CPM。切换到系统全拼输入法后，再输入同一段文本。
            </p>
          </div>
          <SpeedChallenge
            key={`${textId}-quanpin`}
            text={current.text}
            durationSeconds={30}
            onResult={handleResult}
          />
        </section>
      ) : null}

      {step === "done" && flypyCpm !== null && quanpinCpm !== null ? (
        <section className="panel" aria-labelledby="result-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">结果</p>
              <h2 id="result-title">本次对比</h2>
            </div>
            <p className="panel-note">提升比以全拼为基线；样本只有一次，不能当作长期结论。</p>
          </div>

          <dl className="summary-grid">
            <div>
              <dt>小鹤 CPM</dt>
              <dd>{flypyCpm}</dd>
            </div>
            <div>
              <dt>全拼 CPM</dt>
              <dd>{quanpinCpm}</dd>
            </div>
            <div>
              <dt>提升</dt>
              <dd>{improvement === null ? "—" : `${improvement > 0 ? "+" : ""}${improvement}%`}</dd>
            </div>
          </dl>

          <div className="speed-actions">
            <button type="button" className="primary" onClick={() => reset()}>
              再比一次
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel" aria-labelledby="compare-history-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">历史</p>
            <h2 id="compare-history-title">最近 10 次对比</h2>
          </div>
          <p className="panel-note">只保存你主动完成的两次测速，不包含键位练习。</p>
        </div>

        {history.length === 0 ? (
          <p className="muted">还没有对比记录。完成上面的两次测速后会出现在这里。</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">时间</th>
                <th scope="col">文本</th>
                <th scope="col">小鹤</th>
                <th scope="col">全拼</th>
                <th scope="col">提升</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => {
                const delta = improvementPercent(record.flypyCpm, record.quanpinCpm);
                return (
                  <tr key={record.id}>
                    <td>{DATE_FORMAT.format(new Date(record.at))}</td>
                    <td>{record.text}</td>
                    <td>{record.flypyCpm}</td>
                    <td>{record.quanpinCpm}</td>
                    <td>{delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
