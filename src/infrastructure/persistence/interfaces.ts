import { Problem } from "../../domain/models/Problem";
import { Attempt } from "../../domain/models/Attempt";
import { Evaluation } from "../../domain/models/Evaluation";

export interface IProblemRepository {
  findAll(): Promise<Problem[]>;
  findById(id: string): Promise<Problem | null>;
  save(problem: Problem): Promise<void>;
  saveMany(problems: Problem[]): Promise<void>;
}

export interface IAttemptRepository {
  findAll(): Promise<Attempt[]>;
  findById(id: string): Promise<Attempt | null>;
  findByProblemId(problemId: string): Promise<Attempt[]>;
  save(attempt: Attempt): Promise<void>;
  delete(id: string): Promise<boolean>;
}

export interface IEvaluationRepository {
  findAll(): Promise<Evaluation[]>;
  findById(id: string): Promise<Evaluation | null>;
  findByAttemptId(attemptId: string): Promise<Evaluation | null>;
  save(evaluation: Evaluation): Promise<void>;
}
