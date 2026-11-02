import { describe, expect, it } from "vitest";
import { buildSession, newSessionId } from "./recorder";
import { MemoryTrainingRepository } from "./repository";
import type { Attempt } from "./types";

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    sessionId: "session-1",
    exerciseId: "key-final-a",
    kind: "key-recognition",
    knowledgeIds: ["final.a"],
    mode: "key",
    correct: true,
    responseMs: 1200,
    at: 1,
    expected: "a",
    received: "a",
    ...overrides,
  };
}

describe("会话结算", () => {
  it("统计题数、正确数与星级", () => {
    const session = buildSession({
      id: "session-1",
      scope: "lesson:day-1",
      mode: "key",
      startedAt: 0,
      endedAt: 60_000,
      attempts: [attempt(), attempt(), attempt(), attempt({ correct: false })],
      cpm: null,
    });

    expect(session.attempts).toBe(4);
    expect(session.correct).toBe(3);
    expect(session.accuracy).toBe(0.75);
    expect(session.stars).toBe(1);
    expect(session.cpm).toBeNull();
  });

  it("空会话不产生星级", () => {
    const session = buildSession({
      id: "empty",
      scope: "free:1",
      mode: "key",
      startedAt: 0,
      endedAt: 1000,
      attempts: [],
      cpm: null,
    });
    expect(session.attempts).toBe(0);
    expect(session.stars).toBe(0);
  });

  it("会话 id 非空", () => {
    expect(newSessionId().length).toBeGreaterThan(8);
    expect(newSessionId()).not.toBe(newSessionId());
  });
});

describe("内存仓储", () => {
  it("按时间倒序返回作答与会话", async () => {
    const repository = new MemoryTrainingRepository();
    await repository.addAttempt(attempt({ at: 1 }));
    await repository.addAttempt(attempt({ at: 3 }));
    await repository.addAttempt(attempt({ at: 2 }));
    const attempts = await repository.listAttempts(10);
    expect(attempts.map((item) => item.at)).toEqual([3, 2, 1]);

    await repository.saveSession(
      buildSession({ id: "s1", scope: "lesson:day-1", mode: "key", startedAt: 0, endedAt: 10, attempts: [attempt()], cpm: null }),
    );
    await repository.saveSession(
      buildSession({ id: "s2", scope: "lesson:day-2", mode: "key", startedAt: 0, endedAt: 20, attempts: [attempt()], cpm: null }),
    );
    const sessions = await repository.listSessions(10);
    expect(sessions.map((item) => item.id)).toEqual(["s2", "s1"]);
  });

  it("同 id 会话覆盖而不是重复", async () => {
    const repository = new MemoryTrainingRepository();
    const session = buildSession({
      id: "same",
      scope: "lesson:day-1",
      mode: "key",
      startedAt: 0,
      endedAt: 10,
      attempts: [attempt()],
      cpm: null,
    });
    await repository.saveSession(session);
    await repository.saveSession({ ...session, endedAt: 20 });
    const sessions = await repository.listSessions(10);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].endedAt).toBe(20);
  });

  it("掌握度按到期时间筛选", async () => {
    const repository = new MemoryTrainingRepository();
    await repository.putMastery({
      knowledgeId: "a",
      attempts: 1,
      correctAttempts: 1,
      streak: 1,
      ease: 2.2,
      intervalDays: 1,
      lastPracticedAt: 0,
      nextDueAt: 100,
      lastResponseMs: 1000,
    });
    await repository.putMastery({
      knowledgeId: "b",
      attempts: 1,
      correctAttempts: 1,
      streak: 1,
      ease: 2.2,
      intervalDays: 1,
      lastPracticedAt: 0,
      nextDueAt: 300,
      lastResponseMs: 1000,
    });

    expect((await repository.listDue(150)).map((item) => item.knowledgeId)).toEqual(["a"]);
    expect((await repository.listDue(300)).map((item) => item.knowledgeId)).toEqual(["a", "b"]);
  });

  it("清空后不残留数据", async () => {
    const repository = new MemoryTrainingRepository();
    await repository.addAttempt(attempt());
    await repository.saveSession(
      buildSession({ id: "s", scope: "free:1", mode: "key", startedAt: 0, endedAt: 1, attempts: [attempt()], cpm: null }),
    );
    await repository.clear();
    expect(await repository.listAttempts(10)).toEqual([]);
    expect(await repository.listSessions(10)).toEqual([]);
  });
});
