export type FailureKind = "quota" | "network" | "tests" | "auth" | "unknown";

const PATTERNS: Array<[FailureKind, RegExp]> = [
  ["quota", /quota|rate.?limit|usage limit|insufficient|额度|超出限额|429/iu],
  ["network", /etimedout|econnreset|enotfound|socket hang up|network error|网络/iu],
  ["tests", /failing tests|test failed|assertionerror|测试失败/iu],
  ["auth", /unauthorized|forbidden|401|403|not logged in|请先登录|认证失败/iu],
];

export function classifyFailure(output: string): FailureKind {
  for (const [kind, pattern] of PATTERNS) {
    if (pattern.test(output)) return kind;
  }
  return "unknown";
}

export type Decision =
  | { action: "retry"; delayMs: number }
  | { action: "handoff" }
  | { action: "pause"; reason: string };

export function decide(
  kind: FailureKind,
  attempt: number,
  options: { maxNetworkRetries?: number; maxTestRetries?: number } = {},
): Decision {
  const maxNetwork = options.maxNetworkRetries ?? 3;
  const maxTests = options.maxTestRetries ?? 2;

  switch (kind) {
    case "quota":
      return { action: "handoff" };
    case "network":
      return attempt < maxNetwork
        ? { action: "retry", delayMs: Math.min(8000, 500 * 2 ** attempt) }
        : { action: "pause", reason: "网络连续失败" };
    case "tests":
      return attempt < maxTests
        ? { action: "retry", delayMs: 0 }
        : { action: "pause", reason: "测试连续失败，需要人工介入" };
    case "auth":
      return { action: "pause", reason: "认证失败，需要重新登录" };
    default:
      return attempt < 1
        ? { action: "retry", delayMs: 0 }
        : { action: "pause", reason: "未知错误，停止以免重复消耗额度" };
  }
}
