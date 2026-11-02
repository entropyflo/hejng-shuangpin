import { useEffect, useState } from "react";
import { getRepository } from "../data";
import { newSessionId } from "../data/recorder";
import type { CustomText } from "../data/types";
import { MAX_CONTENT_LENGTH, previewOf, validateCustomText } from "../texts/model";
import { CustomTextPractice } from "../ui/CustomTextPractice";

const DATE_FORMAT = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type Draft = { id?: string; content: string; createdAt?: number };

type Result = { correct: number; total: number; elapsedMs: number };

export function TextsPage() {
  const [texts, setTexts] = useState<CustomText[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [practicing, setPracticing] = useState<CustomText | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function load() {
    try {
      setTexts(await getRepository().listTexts());
    } catch {
      setError("无法读取自定义文本，请确认浏览器允许 IndexedDB。");
      setTexts([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveDraft() {
    if (!draft) return;
    const validated = validateCustomText(draft.content);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    const now = Date.now();
    try {
      await getRepository().saveText({
        id: draft.id ?? newSessionId(),
        name: validated.name,
        content: validated.content,
        createdAt: draft.createdAt ?? now,
        updatedAt: now,
      });
      setDraft(null);
      setError(null);
      await load();
    } catch {
      setError("保存失败，请确认浏览器允许 IndexedDB。");
    }
  }

  async function remove(text: CustomText) {
    if (!window.confirm(`删除“${text.name}”？`)) return;
    try {
      await getRepository().deleteText(text.id);
      if (practicing?.id === text.id) stopPractice();
      await load();
    } catch {
      setError("删除失败。");
    }
  }

  function startPractice(text: CustomText) {
    setPracticing(text);
    setStartedAt(Date.now());
    setResult(null);
    setAttemptKey((current) => current + 1);
  }

  function stopPractice() {
    setPracticing(null);
    setStartedAt(null);
    setResult(null);
  }

  function handleComplete(evaluation: { correct: number; total: number }) {
    if (!practicing || startedAt === null || result) return;
    setResult({
      correct: evaluation.correct,
      total: evaluation.total,
      elapsedMs: Date.now() - startedAt,
    });
  }

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">自定义文本</p>
        <h1 className="page-title">粘贴自己的句子来练</h1>
        <p className="lede">
          文本保存在本机 IndexedDB，标题会从正文自动生成。练习时逐字输入小鹤双拼码，汉字与编码同步反馈。
        </p>
        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={() => {
              setDraft({ content: "" });
              setError(null);
            }}
          >
            新建文本
          </button>
        </div>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      {draft ? (
        <section className="panel" aria-labelledby="editor-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{draft.id ? "编辑" : "新建"}</p>
              <h2 id="editor-title">{draft.id ? "修改文本" : "添加一段文本"}</h2>
            </div>
            <p className="panel-note">只保留汉字与常用标点；拉丁字母和换行会被过滤。</p>
          </div>

          <label className="field field-wide">
            <span>正文（最多 {MAX_CONTENT_LENGTH} 字）</span>
            <textarea
              className="ime-input"
              value={draft.content}
              maxLength={MAX_CONTENT_LENGTH + 100}
              onChange={(event) => setDraft({ ...draft, content: event.target.value })}
              placeholder="粘贴或输入要练习的中文"
              rows={4}
            />
          </label>

          <div className="speed-actions">
            <button type="button" className="primary" onClick={() => void saveDraft()}>
              保存
            </button>
            <button type="button" className="secondary" onClick={() => setDraft(null)}>
              取消
            </button>
          </div>
        </section>
      ) : null}

      {practicing ? (
        <section className="panel" aria-labelledby="practice-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">练习中</p>
              <h2 id="practice-title">双拼逐字跟打</h2>
            </div>
            <button type="button" className="secondary" onClick={stopPractice}>
              结束练习
            </button>
          </div>

          <CustomTextPractice
            key={`${practicing.id}-${attemptKey}`}
            text={practicing.content}
            onComplete={handleComplete}
          />

          {result ? (
            <div className="feedback feedback-correct">
              <strong>完成</strong>
              <p>
                用时 {(result.elapsedMs / 1000).toFixed(1)} 秒 · 正确 {result.correct} / {result.total} 字 · 正确率{" "}
                {Math.round((result.correct / result.total) * 100)}%
              </p>
              <button
                type="button"
                className="link"
                onClick={() => {
                  setStartedAt(Date.now());
                  setResult(null);
                  setAttemptKey((current) => current + 1);
                }}
              >
                再练一次
              </button>
            </div>
          ) : null}

          <p className="muted small">自定义文本只显示本次结果，不写入星级与复习排程。</p>
        </section>
      ) : null}

      <section className="panel" aria-labelledby="texts-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">已保存</p>
            <h2 id="texts-title">我的文本</h2>
          </div>
          <p className="panel-note">删除前会二次确认；文本会随备份一起导出。</p>
        </div>

        {texts === null ? (
          <p className="muted">正在读取…</p>
        ) : texts.length === 0 ? (
          <p className="muted">还没有自定义文本。点“新建文本”添加第一段。</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">自动标题</th>
                <th scope="col">内容</th>
                <th scope="col">更新</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {texts.map((text) => (
                <tr key={text.id}>
                  <td>{text.name}</td>
                  <td className="muted">{previewOf(text.content)}</td>
                  <td>{DATE_FORMAT.format(new Date(text.updatedAt))}</td>
                  <td>
                    <div className="token-actions">
                      <button type="button" className="chip" onClick={() => startPractice(text)}>
                        练习
                      </button>
                      <button
                        type="button"
                        className="chip"
                        onClick={() => {
                          setDraft({
                            id: text.id,
                            content: text.content,
                            createdAt: text.createdAt,
                          });
                          setError(null);
                        }}
                      >
                        编辑
                      </button>
                      <button type="button" className="chip" onClick={() => void remove(text)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
