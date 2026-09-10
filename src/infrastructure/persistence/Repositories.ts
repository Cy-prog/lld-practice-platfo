import { Problem } from "../../domain/models/Problem";
import { Attempt } from "../../domain/models/Attempt";
import { Evaluation } from "../../domain/models/Evaluation";
import {
  IProblemRepository,
  IAttemptRepository,
  IEvaluationRepository,
} from "./interfaces";
import { FileBasedStorage } from "./FileBasedStorage";
import { SEED_PROBLEMS } from "../seed/seedProblems";

export class ProblemRepository implements IProblemRepository {
  private storage: FileBasedStorage<Problem>;
  private static inMemorySeed: Map<string, Problem> = new Map(
    SEED_PROBLEMS.map((p) => [p.id, p])
  );

  constructor(storage?: FileBasedStorage<Problem>) {
    this.storage = storage || new FileBasedStorage<Problem>("problems");
  }

  async findAll(): Promise<Problem[]> {
    try {
      const stored = await this.storage.getAll();
      if (stored && stored.length > 0) {
        const merged = new Map(ProblemRepository.inMemorySeed);
        for (const item of stored) {
          merged.set(item.id, item);
        }
        return Array.from(merged.values());
      }
    } catch {
      // Storage fallback
    }
    return Array.from(ProblemRepository.inMemorySeed.values());
  }

  async findById(id: string): Promise<Problem | null> {
    if (!id) return null;
    const rawId = id.trim().toLowerCase();
    const normalized = rawId.replace(/[\s_]+/g, "-");

    // 1. Check in-memory seed first (instant & guarantees 100% availability)
    if (ProblemRepository.inMemorySeed.has(rawId)) {
      return ProblemRepository.inMemorySeed.get(rawId)!;
    }
    if (ProblemRepository.inMemorySeed.has(normalized)) {
      return ProblemRepository.inMemorySeed.get(normalized)!;
    }

    // 2. Check storage
    try {
      const item =
        (await this.storage.getById(rawId)) ||
        (normalized !== rawId ? await this.storage.getById(normalized) : null);
      if (item) return item;
    } catch {
      // Storage fallback
    }

    // 3. Fallback fuzzy search by key match
    for (const [key, prob] of ProblemRepository.inMemorySeed) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return prob;
      }
    }

    return null;
  }

  async save(problem: Problem): Promise<void> {
    ProblemRepository.inMemorySeed.set(problem.id, problem);
    try {
      await this.storage.save(problem);
    } catch {
      // Ignore file error in read-only environment
    }
  }

  async saveMany(problems: Problem[]): Promise<void> {
    for (const p of problems) {
      ProblemRepository.inMemorySeed.set(p.id, p);
    }
    try {
      await this.storage.saveMany(problems);
    } catch {
      // Ignore file error in read-only environment
    }
  }
}

export class AttemptRepository implements IAttemptRepository {
  private storage: FileBasedStorage<Attempt>;

  constructor(storage?: FileBasedStorage<Attempt>) {
    this.storage = storage || new FileBasedStorage<Attempt>("attempts");
  }

  async findAll(): Promise<Attempt[]> {
    const all = await this.storage.getAll();
    // Sort descending by creation date
    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string): Promise<Attempt | null> {
    return this.storage.getById(id);
  }

  async findByProblemId(problemId: string): Promise<Attempt[]> {
    const all = await this.storage.getAll();
    return all
      .filter((a) => a.problemId === problemId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }

  async save(attempt: Attempt): Promise<void> {
    await this.storage.save(attempt);
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }
}

export class EvaluationRepository implements IEvaluationRepository {
  private storage: FileBasedStorage<Evaluation>;

  constructor(storage?: FileBasedStorage<Evaluation>) {
    this.storage = storage || new FileBasedStorage<Evaluation>("evaluations");
  }

  async findAll(): Promise<Evaluation[]> {
    return this.storage.getAll();
  }

  async findById(id: string): Promise<Evaluation | null> {
    return this.storage.getById(id);
  }

  async findByAttemptId(attemptId: string): Promise<Evaluation | null> {
    const all = await this.storage.getAll();
    const evaluation = all.find((e) => e.attemptId === attemptId);
    return evaluation || null;
  }

  async save(evaluation: Evaluation): Promise<void> {
    await this.storage.save(evaluation);
  }
}
