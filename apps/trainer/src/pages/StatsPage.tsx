import { useEffect, useMemo, useState } from "react";
import { LESSONS } from "../curriculum/content";
import { getRepository } from "../data";
import { starsToText } from "../data/metrics";
import type { Attempt, PracticeSession } from "../data/types";
import { keyAccuracy, summarizeMistakes } from "../review/plan";
import { KeyHeatmap } from "../ui/KeyHeatmap";
import { Link } from "../ui/Link";

const KIND_LABEL: Record<Attempt["kind"], string> = {
  "key-recognition": "键位认知",
  "reverse-recall": "反向记忆",
  "syllable-composition": "组合拼读",
  "text-typing": "词句输入",
  "speed-challenge": "速度挑战",
};

const DATE_FORMAT = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function scopeLabel(scope: string): string {
  if (scope.startsWith("lesson:")) return `课程 ${scope.slice("lesson:".length)}`;
  if (scope.startsWith("free:")) return "自由训练";
  return scope;
}

export function StatsPage() {
  const [sessions, setSessions] = useState<PracticeSession[] | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function load() {
    try {
      const repository = getRepository();
      const [nextSessions, nextAttempts] = await Promise.all([
        repository.listSessions(20),
        repository.listAttempts(1000),
      ]);
      setSessions(nextSessions);
      setAttempts(nextAttempts);
      setError(null);
    } catch {
      setError("无法读取本机数据库，请确认浏览器允许 IndexedDB。");
      setSessions([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    const total = attempts.length;
    const correct = attempts.filter((attempt) => attempt.correct).length;
    const bestCpm = (sessions ?? []).reduce<number | null>((best, session) => {
      if (session.cpm === null) return best;
      return Math.max(best ?? 0, session.cpm);
    }, null);
    return { total, correct, accuracy: total === 0 ? 0 : Math.round((correct / total) * 100), bestCpm };
  }, [attempts, sessions]);

  const keyStats = useMemo(() => keyAccuracy(attempts), [attempts]);
  const mistakes = useMemo(() => summarizeMistakes(attempts, 8), [attempts]);

  const byKind = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const attempt of attempts) {
      const entry = map.get(attempt.kind) ?? { total: 0, correct: 0 };
      entry.total += 1;
      if (attempt.correct) entry.correct += 1;
      map.set(attempt.kind, entry);
    }
    return [...map.entries()].sort((left, right) => right[1].total - left[1].total);
  }, [attempts]);

  async function clearAll() {
    await getRepository().clear();
    setConfirmClear(false);
    await load();
  }

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">统计</p>
        <h1 className="page-title">本机真实记录</h1>
        <p className="lede">所有数字来自你在本机的作答事件，保存在 IndexedDB，不上传服务器。</p>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      {sessions === null ? (
        <section className="panel">
          <p className="muted">正在读取本机记录…</p>
        </section>
      ) : sessions.length === 0 && attempts.length === 0 ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">还没有数据</p>
              <h2>先完成一轮练习</h2>
            </div>
            <p className="panel-note">
              完成一整轮题目后才会写入会话记录；中途离开的作答也会作为单题事件保存，但不会计入会话星级。
            </p>
          </div>
          <div className="actions">
            <Link to="/lesson/day-1" className="primary">
              从第 1 天开始
            </Link>
            <Link to="/practice" className="secondary">
              自由训练
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="panel" aria-labelledby="totals-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">总览</p>
                <h2 id="totals-title">最近表现</h2>
              </div>
              <p className="panel-note">
                CPM 只统计速度挑战中的正确汉字数，不把键位练习换算成 CPM。
              </p>
            </div>
            <dl className="stat-row">
              <div>
                <dt>会话</dt>
                <dd>{sessions.length}</dd>
              </div>
              <div>
                <dt>作答</dt>
                <dd>{totals.total}</dd>
              </div>
              <div>
                <dt>正确率</dt>
                <dd>{totals.accuracy}%</dd>
              </div>
              <div>
                <dt>最佳 CPM</dt>
                <dd>{totals.bestCpm ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="panel" aria-labelledby="kind-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">分项</p>
                <h2 id="kind-title">各题型正确率</h2>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">题型</th>
                  <th scope="col">作答</th>
                  <th scope="col">正确</th>
                  <th scope="col">正确率</th>
                </tr>
              </thead>
              <tbody>
                {byKind.map(([kind, entry]) => (
                  <tr key={kind}>
                    <td>{KIND_LABEL[kind as Attempt["kind"]] ?? kind}</td>
                    <td>{entry.total}</td>
                    <td>{entry.correct}</td>
                    <td>{Math.round((entry.correct / entry.total) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel" aria-labelledby="heatmap-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">薄弱定位</p>
                <h2 id="heatmap-title">键位热力图</h2>
              </div>
              <p className="panel-note">只统计键位认知题；点任意键直接进入该键的专项练习。</p>
            </div>
            <KeyHeatmap stats={keyStats} />
          </section>

          <section className="panel" aria-labelledby="mistakes-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">错题本</p>
                <h2 id="mistakes-title">最常错的题</h2>
              </div>
              <p className="panel-note">按错误次数排序；点“重练”回到对应课时。</p>
            </div>
            {mistakes.length === 0 ? (
              <p className="muted">还没有错题。继续练习后，答错的题目会出现在这里。</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">题目</th>
                    <th scope="col">错误次数</th>
                    <th scope="col">最近错误</th>
                    <th scope="col">重练</th>
                  </tr>
                </thead>
                <tbody>
                  {mistakes.map((mistake) => {
                    const lesson = LESSONS.find((item) => item.exerciseIds.includes(mistake.exerciseId));
                    return (
                      <tr key={mistake.exerciseId}>
                        <td>{mistake.prompt}</td>
                        <td>{mistake.count}</td>
                        <td>{DATE_FORMAT.format(new Date(mistake.lastAt))}</td>
                        <td>
                          {lesson ? (
                            <Link to={`/lesson/${lesson.id}`} className="link">
                              第 {lesson.day} 天
                            </Link>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel" aria-labelledby="history-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">历史</p>
                <h2 id="history-title">最近 20 次会话</h2>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">时间</th>
                  <th scope="col">范围</th>
                  <th scope="col">模式</th>
                  <th scope="col">题数</th>
                  <th scope="col">正确率</th>
                  <th scope="col">星级</th>
                  <th scope="col">CPM</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{DATE_FORMAT.format(new Date(session.endedAt))}</td>
                    <td>{scopeLabel(session.scope)}</td>
                    <td>{session.mode === "ime" ? "输入法" : "按键"}</td>
                    <td>{session.attempts}</td>
                    <td>{Math.round(session.accuracy * 100)}%</td>
                    <td className="stars">{starsToText(session.stars)}</td>
                    <td>{session.cpm ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">数据</p>
                <h2>清空本机记录</h2>
              </div>
              <p className="panel-note">会删除全部作答、会话与掌握度；此操作不可撤销。</p>
            </div>
            {confirmClear ? (
              <div className="speed-actions">
                <button type="button" className="primary" onClick={() => void clearAll()}>
                  确认清空
                </button>
                <button type="button" className="secondary" onClick={() => setConfirmClear(false)}>
                  取消
                </button>
              </div>
            ) : (
              <button type="button" className="secondary" onClick={() => setConfirmClear(true)}>
                清空记录
              </button>
            )}
          </section>
        </>
      )}
    </>
  );
}
