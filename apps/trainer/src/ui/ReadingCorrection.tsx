import { useMemo, useState } from "react";
import { encodeSyllable } from "../scheme/flypy";
import {
  analyzeReadings,
  parsePinyinSyllable,
  ReadingOverrideRepository,
  type ReadingToken,
} from "../scheme/readings";

const TEXT_ID = "sandbox-text";
const TEXT_VERSION = "v1";
const PRESETS = ["银行", "行走", "音乐", "行", "重", "乐"];

const STATUS_LABEL: Record<ReadingToken["status"], string> = {
  confirmed: "已确认",
  ambiguous: "有歧义",
  unknown: "未知",
};

function tokenKey(token: ReadingToken): string {
  return `${token.spanStart}-${token.spanEnd}`;
}

function codesFor(token: ReadingToken): string {
  if (!token.selectedReading) return "待确认";
  try {
    return token.selectedReading.map((reading) => encodeSyllable(parsePinyinSyllable(reading)).code).join(" ");
  } catch {
    return "无法编码";
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "操作失败";
}

export function ReadingCorrection() {
  const [repository] = useState(() => new ReadingOverrideRepository(window.localStorage));
  const [text, setText] = useState("银行");
  const [overrides, setOverrides] = useState(() => repository.load());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const analysis = useMemo(() => {
    try {
      return {
        tokens: analyzeReadings({ textId: TEXT_ID, textVersion: TEXT_VERSION, text, overrides }),
        error: null as string | null,
      };
    } catch (caught) {
      return { tokens: [] as ReadingToken[], error: errorMessage(caught) };
    }
  }, [text, overrides]);

  function saveOverride(token: ReadingToken, reading: string[]) {
    const expectedLength = Array.from(token.text).length;
    if (reading.length !== expectedLength) {
      setError(`“${token.text}”需要 ${expectedLength} 个读音，当前收到 ${reading.length} 个。`);
      return;
    }
    try {
      for (const syllable of reading) {
        encodeSyllable(parsePinyinSyllable(syllable));
      }
      const next = repository.upsert({
        textId: TEXT_ID,
        textVersion: TEXT_VERSION,
        spanStart: token.spanStart,
        spanEnd: token.spanEnd,
        reading,
        updatedAt: new Date().toISOString(),
      });
      setOverrides(next);
      setDrafts((current) => ({ ...current, [tokenKey(token)]: "" }));
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  function clearAll() {
    repository.save([]);
    setOverrides([]);
    setDrafts({});
    setError(null);
  }

  const visibleError = analysis.error ?? error;

  return (
    <section className="panel" aria-labelledby="readings-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">多音字与人工修正</p>
          <h2 id="readings-title">改读音并保存</h2>
        </div>
        <p className="panel-note">
          修正写入本机 localStorage，刷新页面后仍然生效；不会上传到任何服务器。
        </p>
      </div>

      <div className="preset-row" aria-label="示例文本">
        {PRESETS.map((preset) => (
          <button key={preset} type="button" className="chip" onClick={() => setText(preset)}>
            {preset}
          </button>
        ))}
      </div>

      <label className="field">
        <span>待分析文本</span>
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value.slice(0, 40));
            setDrafts({});
            setError(null);
          }}
          maxLength={40}
          placeholder="输入词语或短句"
        />
      </label>

      {visibleError ? <p className="error-text">{visibleError}</p> : null}

      <table className="data-table token-table">
        <caption>逐词读音与双拼码</caption>
        <thead>
          <tr>
            <th scope="col">文本</th>
            <th scope="col">状态</th>
            <th scope="col">读音</th>
            <th scope="col">双拼码</th>
            <th scope="col">修正</th>
          </tr>
        </thead>
        <tbody>
          {analysis.tokens.map((token) => (
            <tr key={tokenKey(token)}>
              <td className="token-text">{token.text}</td>
              <td>
                <span className={`badge badge-${token.status}`}>{STATUS_LABEL[token.status]}</span>
              </td>
              <td>
                {token.selectedReading ? (
                  <code>{token.selectedReading.join(" ")}</code>
                ) : token.candidates.length > 0 ? (
                  <span className="muted">{token.candidates.map((candidate) => candidate.join(" ")).join(" / ")}</span>
                ) : (
                  <span className="muted">未收录</span>
                )}
              </td>
              <td>
                <code>{codesFor(token)}</code>
              </td>
              <td>
                <div className="token-actions">
                  {token.candidates.map((candidate) => (
                    <button
                      key={candidate.join("-")}
                      type="button"
                      className="chip"
                      onClick={() => saveOverride(token, candidate)}
                    >
                      {candidate.join(" ")}
                    </button>
                  ))}
                  <input
                    className="draft-input"
                    value={drafts[tokenKey(token)] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [tokenKey(token)]: event.target.value }))
                    }
                    placeholder="自定义读音"
                    aria-label={`为 ${token.text} 输入读音`}
                  />
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      const raw = (drafts[tokenKey(token)] ?? "").trim();
                      const reading = raw.split(/\s+/u).filter(Boolean);
                      if (reading.length === 0) {
                        setError("请先输入读音，多个字用空格分隔。");
                        return;
                      }
                      saveOverride(token, reading);
                    }}
                  >
                    保存
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="exercise-footer">
        <span className="muted">已保存修正 {overrides.length} 条</span>
        <button type="button" className="secondary" onClick={clearAll} disabled={overrides.length === 0}>
          清除全部修正
        </button>
      </div>

      <p className="muted small">
        歧义字（行、重、乐）不会自动定音；未收录的字显示为“未知”，可手动指定读音后生成固定编码。
      </p>
    </section>
  );
}
