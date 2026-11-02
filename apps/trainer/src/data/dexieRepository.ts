import Dexie, { type Table } from "dexie";
import type { TrainingRepository } from "./repository";
import type { Attempt, MasteryRecord, PracticeSession } from "./types";

class TrainerDatabase extends Dexie {
  attempts!: Table<Attempt, number>;
  sessions!: Table<PracticeSession, string>;
  mastery!: Table<MasteryRecord, string>;

  constructor() {
    super("xiaohe-trainer");
    this.version(1).stores({
      attempts: "++id, sessionId, exerciseId, at",
      sessions: "id, endedAt",
      mastery: "knowledgeId, nextDueAt",
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

  async clear(): Promise<void> {
    await this.db.transaction("rw", this.db.attempts, this.db.sessions, this.db.mastery, async () => {
      await Promise.all([this.db.attempts.clear(), this.db.sessions.clear(), this.db.mastery.clear()]);
    });
  }
}
