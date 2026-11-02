import type { BackupData } from "./backup";
import type { Attempt, ComparisonRecord, CustomText, MasteryRecord, PracticeSession } from "./types";

export interface TrainingRepository {
  addAttempt(attempt: Attempt): Promise<void>;
  listAttempts(limit: number): Promise<Attempt[]>;
  saveSession(session: PracticeSession): Promise<void>;
  listSessions(limit: number): Promise<PracticeSession[]>;
  getMastery(knowledgeId: string): Promise<MasteryRecord | undefined>;
  putMastery(record: MasteryRecord): Promise<void>;
  listDue(now: number): Promise<MasteryRecord[]>;
  saveComparison(record: ComparisonRecord): Promise<void>;
  listTexts(): Promise<CustomText[]>;
  saveText(text: CustomText): Promise<void>;
  deleteText(id: string): Promise<void>;
  listComparisons(limit: number): Promise<ComparisonRecord[]>;
  exportAll(): Promise<BackupData>;
  replaceAll(data: BackupData): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryTrainingRepository implements TrainingRepository {
  private attempts: Attempt[] = [];
  private sessions: PracticeSession[] = [];
  private mastery = new Map<string, MasteryRecord>();
  private comparisons: ComparisonRecord[] = [];
  private texts = new Map<string, CustomText>();

  async addAttempt(attempt: Attempt): Promise<void> {
    this.attempts.push(attempt);
  }

  async listAttempts(limit: number): Promise<Attempt[]> {
    return [...this.attempts].sort((left, right) => right.at - left.at).slice(0, limit);
  }

  async saveSession(session: PracticeSession): Promise<void> {
    this.sessions = this.sessions.filter((item) => item.id !== session.id);
    this.sessions.push(session);
  }

  async listSessions(limit: number): Promise<PracticeSession[]> {
    return [...this.sessions].sort((left, right) => right.endedAt - left.endedAt).slice(0, limit);
  }

  async getMastery(knowledgeId: string): Promise<MasteryRecord | undefined> {
    return this.mastery.get(knowledgeId);
  }

  async putMastery(record: MasteryRecord): Promise<void> {
    this.mastery.set(record.knowledgeId, record);
  }

  async listDue(now: number): Promise<MasteryRecord[]> {
    return [...this.mastery.values()]
      .filter((record) => record.nextDueAt <= now)
      .sort((left, right) => left.nextDueAt - right.nextDueAt);
  }

  async saveComparison(record: ComparisonRecord): Promise<void> {
    this.comparisons = this.comparisons.filter((item) => item.id !== record.id);
    this.comparisons.push(record);
  }

  async listComparisons(limit: number): Promise<ComparisonRecord[]> {
    return [...this.comparisons].sort((left, right) => right.at - left.at).slice(0, limit);
  }

  async listTexts(): Promise<CustomText[]> {
    return [...this.texts.values()].sort((left, right) => right.updatedAt - left.updatedAt);
  }

  async saveText(text: CustomText): Promise<void> {
    this.texts.set(text.id, text);
  }

  async deleteText(id: string): Promise<void> {
    this.texts.delete(id);
  }

  async exportAll(): Promise<BackupData> {
    return {
      attempts: [...this.attempts],
      sessions: [...this.sessions],
      mastery: [...this.mastery.values()],
      comparisons: [...this.comparisons],
      texts: [...this.texts.values()],
    };
  }

  async replaceAll(data: BackupData): Promise<void> {
    this.attempts = [...data.attempts];
    this.sessions = [...data.sessions];
    this.mastery = new Map(data.mastery.map((record) => [record.knowledgeId, record]));
    this.comparisons = [...data.comparisons];
    this.texts = new Map(data.texts.map((text) => [text.id, text]));
  }

  async clear(): Promise<void> {
    this.attempts = [];
    this.sessions = [];
    this.mastery.clear();
    this.comparisons = [];
    this.texts.clear();
  }
}
