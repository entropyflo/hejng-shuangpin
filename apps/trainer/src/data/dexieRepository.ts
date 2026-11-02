import Dexie, { type Table } from "dexie";
import type { TrainingRepository } from "./repository";
import type { Attempt, ComparisonRecord, MasteryRecord, PracticeSession } from "./types";

class TrainerDatabase extends Dexie {
  attempts!: Table<Attempt, number>;
  sessions!: Table<PracticeSession, string>;
  mastery!: Table<MasteryRecord, string>;
  comparisons!: Table<ComparisonRecord, string>;

  constructor() {
    super("xiaohe-trainer");
    this.version(1).stores({
      attempts: "++id, sessionId, exerciseId, at",
      sessions: "id, endedAt",
      mastery: "knowledgeId, nextDueAt",
    });
    // v2 只新增 comparisons 表，不改动 v1 的 attempts / sessions / mastery 数据。
    this.version(2).stores({
      comparisons: "id, at",
    });
  }
}

export class DexieTrainingRepository implements TrainingRepository {
  private readonly db = new TrainerDatabase();

  async addAttempt(attempt: Attempt): Promise<void> {
    await this.db.attempts.add(attempt);
  }

  async listAttempts(limit: number): Promise<Attempt[]> {
    return this.db.attempts.orderBy("at").reverse().limit(limit).toArray();
  }

  async saveSession(session: PracticeSession): Promise<void> {
    await this.db.sessions.put(session);
  }

  async listSessions(limit: number): Promise<PracticeSession[]> {
    return this.db.sessions.orderBy("endedAt").reverse().limit(limit).toArray();
  }

  async getMastery(knowledgeId: string): Promise<MasteryRecord | undefined> {
    return this.db.mastery.get(knowledgeId);
  }

  async putMastery(record: MasteryRecord): Promise<void> {
    await this.db.mastery.put(record);
  }

  async listDue(now: number): Promise<MasteryRecord[]> {
    return this.db.mastery.where("nextDueAt").belowOrEqual(now).toArray();
  }

  async saveComparison(record: ComparisonRecord): Promise<void> {
    await this.db.comparisons.put(record);
  }

  async listComparisons(limit: number): Promise<ComparisonRecord[]> {
    return this.db.comparisons.orderBy("at").reverse().limit(limit).toArray();
  }

  async clear(): Promise<void> {
    await this.db.transaction(
      "rw",
      this.db.attempts,
      this.db.sessions,
      this.db.mastery,
      this.db.comparisons,
      async () => {
        await Promise.all([
          this.db.attempts.clear(),
          this.db.sessions.clear(),
          this.db.mastery.clear(),
          this.db.comparisons.clear(),
        ]);
      },
    );
  }
}
