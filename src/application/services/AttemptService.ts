import { IAttemptRepository, IProblemRepository } from "../../infrastructure/persistence/interfaces";
import { Attempt, createInitialDraftContent } from "../../domain/models/Attempt";
import { StructuredTextSubmissionContent } from "../../domain/models/Submission";
import { AttemptStateMachine, DomainError } from "../../domain/services/AttemptStateMachine";
import { DeterministicValidator, ValidationResult } from "../../infrastructure/validation/DeterministicValidator";
import { v4 as uuidv4 } from "uuid";

export interface SubmitAttemptResult {
  attempt: Attempt;
  validation: ValidationResult;
}

export class AttemptService {
  constructor(
    private attemptRepo: IAttemptRepository,
    private problemRepo: IProblemRepository
  ) {}

  async getAttempts(problemId?: string): Promise<Attempt[]> {
    if (problemId) {
      return this.attemptRepo.findByProblemId(problemId);
    }
    return this.attemptRepo.findAll();
  }

  async getAttemptById(id: string): Promise<Attempt | null> {
    return this.attemptRepo.findById(id);
  }

  async startAttempt(problemId: string): Promise<Attempt> {
    const problem = await this.problemRepo.findById(problemId);
    if (!problem) {
      throw new DomainError(`Problem with id '${problemId}' not found.`);
    }

    const existingAttempts = await this.attemptRepo.findByProblemId(problemId);
    const attemptNumber = existingAttempts.length + 1;
    const now = new Date().toISOString();

    const newAttempt: Attempt = {
      id: `att-${uuidv4()}`,
      problemId,
      attemptNumber,
      status: "DRAFT",
      draftContent: createInitialDraftContent(),
      submission: null,
      evaluationId: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      completedAt: null,
    };

    await this.attemptRepo.save(newAttempt);
    return newAttempt;
  }

  async updateDraft(
    id: string,
    content: Partial<StructuredTextSubmissionContent>
  ): Promise<Attempt> {
    const attempt = await this.attemptRepo.findById(id);
    if (!attempt) {
      throw new DomainError(`Attempt '${id}' not found.`);
    }

    const updated = AttemptStateMachine.updateDraft(attempt, content);
    await this.attemptRepo.save(updated);
    return updated;
  }

  async submitAttempt(
    id: string,
    content?: StructuredTextSubmissionContent
  ): Promise<SubmitAttemptResult> {
    const attempt = await this.attemptRepo.findById(id);
    if (!attempt) {
      throw new DomainError(`Attempt '${id}' not found.`);
    }

    const targetContent = content || attempt.draftContent;

    // Deterministic validation BEFORE state transition
    const validation = DeterministicValidator.validate(targetContent, attempt);
    if (!validation.isValid) {
      return { attempt, validation };
    }

    const { attempt: submittedAttempt } = AttemptStateMachine.submit(attempt, targetContent);
    await this.attemptRepo.save(submittedAttempt);

    return { attempt: submittedAttempt, validation };
  }

  async retryAttempt(attemptId: string): Promise<Attempt> {
    const previous = await this.attemptRepo.findById(attemptId);
    if (!previous) {
      throw new DomainError(`Attempt '${attemptId}' not found.`);
    }

    if (!AttemptStateMachine.canRetry(previous)) {
      throw new DomainError(
        `Cannot retry attempt in status '${previous.status}'. Attempt must be COMPLETED or FAILED.`
      );
    }

    const problemAttempts = await this.attemptRepo.findByProblemId(previous.problemId);
    const attemptNumber = problemAttempts.length + 1;
    const now = new Date().toISOString();

    // Clone content from previous submission or draft for seamless iteration
    const prefilledContent: StructuredTextSubmissionContent = previous.submission
      ? JSON.parse(JSON.stringify(previous.submission.content))
      : JSON.parse(JSON.stringify(previous.draftContent));

    const newAttempt: Attempt = {
      id: `att-${uuidv4()}`,
      problemId: previous.problemId,
      attemptNumber,
      status: "DRAFT",
      draftContent: prefilledContent,
      submission: null,
      evaluationId: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      completedAt: null,
    };

    await this.attemptRepo.save(newAttempt);
    return newAttempt;
  }
}
