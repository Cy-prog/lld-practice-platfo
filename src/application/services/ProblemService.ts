import { IProblemRepository, IAttemptRepository, IEvaluationRepository } from "../../infrastructure/persistence/interfaces";
import { Problem } from "../../domain/models/Problem";
import { SEED_PROBLEMS } from "../../infrastructure/seed/seedProblems";

export type ProblemPracticeStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "NEEDS_IMPROVEMENT";

export interface ProblemWithStats extends Problem {
  attemptsCount: number;
  bestScore: number | null;
  status: ProblemPracticeStatus;
  latestAttemptId: string | null;
}

export class ProblemService {
  constructor(
    private problemRepo: IProblemRepository,
    private attemptRepo: IAttemptRepository,
    private evaluationRepo: IEvaluationRepository
  ) {}

  async initializeSeedDataIfEmpty(): Promise<void> {
    const existing = await this.problemRepo.findAll();
    if (existing.length === 0) {
      await this.problemRepo.saveMany(SEED_PROBLEMS);
    }
  }

  async getAllProblems(): Promise<ProblemWithStats[]> {
    await this.initializeSeedDataIfEmpty();
    const problems = await this.problemRepo.findAll();
    const attempts = await this.attemptRepo.findAll();
    const evaluations = await this.evaluationRepo.findAll();

    const evalMap = new Map(evaluations.map((e) => [e.id, e]));

    return problems.map((problem) => {
      const problemAttempts = attempts.filter((a) => a.problemId === problem.id);
      const count = problemAttempts.length;

      let bestScore: number | null = null;
      let status: ProblemPracticeStatus = "NOT_STARTED";
      let latestAttemptId: string | null = null;

      if (count > 0) {
        // Sorted newest first
        const latest = problemAttempts[0];
        latestAttemptId = latest.id;

        if (latest.status === "DRAFT" || latest.status === "SUBMITTED" || latest.status === "EVALUATING") {
          status = "IN_PROGRESS";
        }

        const completedAttempts = problemAttempts.filter(
          (a) => a.status === "COMPLETED" && a.evaluationId
        );

        if (completedAttempts.length > 0) {
          const scores = completedAttempts
            .map((a) => evalMap.get(a.evaluationId!)?.overallScore)
            .filter((s): s is number => typeof s === "number");

          if (scores.length > 0) {
            bestScore = Math.max(...scores);
            const latestEval = evalMap.get(completedAttempts[0].evaluationId!);
            const latestScore = latestEval ? latestEval.overallScore : 0;
            status = latestScore >= 75 ? "COMPLETED" : "NEEDS_IMPROVEMENT";
          }
        }
      }

      return {
        ...problem,
        attemptsCount: count,
        bestScore,
        status,
        latestAttemptId,
      };
    });
  }

  async getProblemById(id: string): Promise<Problem | null> {
    await this.initializeSeedDataIfEmpty();
    return this.problemRepo.findById(id);
  }
}
