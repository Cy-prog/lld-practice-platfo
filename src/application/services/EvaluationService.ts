import {
  IAttemptRepository,
  IProblemRepository,
  IEvaluationRepository,
} from "../../infrastructure/persistence/interfaces";
import { Evaluation } from "../../domain/models/Evaluation";
import { STANDARD_LLD_RUBRIC } from "../../domain/models/Rubric";
import { AttemptStateMachine, DomainError } from "../../domain/services/AttemptStateMachine";
import { EvaluatorFactory } from "../../infrastructure/evaluators/EvaluatorFactory";
import { AttemptComparator, AttemptComparisonResult } from "../../domain/services/AttemptComparator";

export class EvaluationService {
  constructor(
    private attemptRepo: IAttemptRepository,
    private problemRepo: IProblemRepository,
    private evaluationRepo: IEvaluationRepository
  ) {}

  async evaluateAttempt(
    attemptId: string,
    evaluatorModeOverride?: "gemini" | "mock",
    apiKeyOverride?: string
  ): Promise<Evaluation> {
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) {
      throw new DomainError(`Attempt '${attemptId}' not found.`);
    }

    if (!attempt.submission) {
      throw new DomainError(`Attempt '${attemptId}' has no submission snapshot to evaluate.`);
    }

    // Idempotency check: if already evaluating, do not launch a second one
    if (attempt.status === "EVALUATING") {
      throw new DomainError(`Evaluation is already in progress for attempt '${attemptId}'.`);
    }

    // If already completed and evaluation exists, return existing evaluation
    if (attempt.status === "COMPLETED" && attempt.evaluationId) {
      const existing = await this.evaluationRepo.findById(attempt.evaluationId);
      if (existing) {
        return existing;
      }
    }

    // Guard state transition to EVALUATING
    const evaluatingAttempt = AttemptStateMachine.markEvaluating(attempt);
    await this.attemptRepo.save(evaluatingAttempt);

    const problem = await this.problemRepo.findById(attempt.problemId);
    if (!problem) {
      const failed = AttemptStateMachine.failEvaluation(
        evaluatingAttempt,
        `Problem '${attempt.problemId}' was not found.`
      );
      await this.attemptRepo.save(failed);
      throw new DomainError(`Problem '${attempt.problemId}' not found.`);
    }

    const evaluator = EvaluatorFactory.createEvaluator(evaluatorModeOverride, apiKeyOverride);

    try {
      const evaluation = await evaluator.evaluate({
        problem,
        submission: attempt.submission,
        rubric: STANDARD_LLD_RUBRIC,
      });

      // Persist evaluation
      await this.evaluationRepo.save(evaluation);

      // Transition attempt to COMPLETED
      const completedAttempt = AttemptStateMachine.completeEvaluation(
        evaluatingAttempt,
        evaluation.id
      );
      await this.attemptRepo.save(completedAttempt);

      return evaluation;
    } catch (err: any) {
      // Preserve submission and mark attempt as FAILED for retryability
      const failedAttempt = AttemptStateMachine.failEvaluation(
        evaluatingAttempt,
        err.message || "Evaluation encountered an unrecoverable error."
      );
      await this.attemptRepo.save(failedAttempt);
      throw err;
    }
  }

  async getEvaluationForAttempt(attemptId: string): Promise<Evaluation | null> {
    return this.evaluationRepo.findByAttemptId(attemptId);
  }

  async getAttemptComparison(attemptId: string): Promise<AttemptComparisonResult | null> {
    const currentAttempt = await this.attemptRepo.findById(attemptId);
    if (!currentAttempt || !currentAttempt.evaluationId) {
      return null;
    }

    const currentEval = await this.evaluationRepo.findById(currentAttempt.evaluationId);
    if (!currentEval) {
      return null;
    }

    // Check if there is an earlier attempt for this problem
    const problemAttempts = await this.attemptRepo.findByProblemId(currentAttempt.problemId);
    const earlierCompleted = problemAttempts
      .filter(
        (a) =>
          a.attemptNumber < currentAttempt.attemptNumber &&
          a.status === "COMPLETED" &&
          a.evaluationId
      )
      .sort((a, b) => b.attemptNumber - a.attemptNumber);

    if (earlierCompleted.length === 0) {
      return null;
    }

    const previousEval = await this.evaluationRepo.findById(earlierCompleted[0].evaluationId!);
    if (!previousEval) {
      return null;
    }

    return AttemptComparator.compare(currentEval, previousEval);
  }
}
