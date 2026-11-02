import { DexieTrainingRepository } from "./dexieRepository";
import type { TrainingRepository } from "./repository";

let repository: TrainingRepository | null = null;

export function getRepository(): TrainingRepository {
  repository ??= new DexieTrainingRepository();
  return repository;
}

export type { TrainingRepository } from "./repository";
