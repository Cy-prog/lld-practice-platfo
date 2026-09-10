import { Problem } from "../../domain/models/Problem";
import { Attempt } from "../../domain/models/Attempt";
import { Evaluation } from "../../domain/models/Evaluation";
import {
  IProblemRepository,
  IAttemptRepository,
  IEvaluationRepository,
} from "./interfaces";
import { FileBasedStorage } from "./FileBasedStorage";

export class ProblemRepository implements IProblemRepository {
  private storage: FileBasedStorage<Problem>;

  constructor(storage?: FileBasedStorage<Problem>) {
    this.storage = storage || new FileBasedStorage<Problem>("problems");
  }

  async findAll(): Promise<Problem[]> {
    return this.storage.getAll();
  }

  async findById(id: string): Promise<Problem | null> {
    return this.storage.getById(id);
  }

  async save(problem: Problem): Promise<void> {
    await this.storage.save(problem);
  }

  async saveMany(problems: Problem[]): Promise<void> {
    await this.storage.saveMany(problems);
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
