import Dexie, { type Table } from "dexie";
import type { BackupData } from "./backup";
import type { TrainingRepository } from "./repository";
import type { Attempt, ComparisonRecord, CustomText, MasteryRecord, PracticeSession } from "./types";

class TrainerDatabase extends Dexie {
  attempts!: Table<Attempt, number>;
  sessions!: Table<PracticeSession, string>;
  mastery!: Table<MasteryRecord, string>;
  comparisons!: Table<ComparisonRecord, string>;
  texts!: Table<CustomText, string>;

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
    // v3 新增自定义文本表，v2 数据保持不变。
    this.version(3).stores({
      texts: "id, updatedAt",
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

  async listTexts(): Promise<CustomText[]> {
    return this.db.texts.orderBy("updatedAt").reverse().toArray();
  }

  async saveText(text: CustomText): Promise<void> {
    await this.db.texts.put(text);
  }

  async deleteText(id: string): Promise<void> {
    await this.db.texts.delete(id);
  }

  async exportAll(): Promise<BackupData> {
    return this.db.transaction(
      "r",
      this.db.attempts,
      this.db.sessions,
      this.db.mastery,
      this.db.comparisons,
      this.db.texts,
      async () => ({
        attempts: await this.db.attempts.toArray(),
        sessions: await this.db.sessions.toArray(),
        mastery: await this.db.mastery.toArray(),
        comparisons: await this.db.comparisons.toArray(),
        texts: await this.db.texts.toArray(),
      }),
    );
  }

  async replaceAll(data: BackupData): Promise<void> {
    await this.db.transaction(
      "rw",
      this.db.attempts,
      this.db.sessions,
      this.db.mastery,
      this.db.comparisons,
      this.db.texts,
      async () => {
        await Promise.all([
          this.db.attempts.clear(),
          this.db.sessions.clear(),
          this.db.mastery.clear(),
          this.db.comparisons.clear(),
          this.db.texts.clear(),
        ]);
        if (data.attempts.length > 0) await this.db.attempts.bulkAdd(data.attempts);
        if (data.sessions.length > 0) await this.db.sessions.bulkPut(data.sessions);
        if (data.mastery.length > 0) await this.db.mastery.bulkPut(data.mastery);
        if (data.comparisons.length > 0) await this.db.comparisons.bulkPut(data.comparisons);
        if (data.texts.length > 0) await this.db.texts.bulkPut(data.texts);
      },
    );
  }

  async clear(): Promise<void> {
    await this.db.transaction(
      "rw",
      this.db.attempts,
      this.db.sessions,
      this.db.mastery,
      this.db.comparisons,
      this.db.texts,
      async () => {
        await Promise.all([
          this.db.attempts.clear(),
          this.db.sessions.clear(),
          this.db.mastery.clear(),
          this.db.comparisons.clear(),
          this.db.texts.clear(),
        ]);
      },
    );
  }
}
