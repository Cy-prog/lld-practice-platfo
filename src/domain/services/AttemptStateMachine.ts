import { Attempt } from "../models/Attempt";
import { Submission, StructuredTextSubmissionContent } from "../models/Submission";
import { v4 as uuidv4 } from "uuid";

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(currentStatus: string, action: string, allowedStatuses: string[]) {
    super(
      `Cannot execute '${action}' on attempt in '${currentStatus}' status. Allowed statuses: [${allowedStatuses.join(
        ", "
      )}]`
    );
    this.name = "InvalidStateTransitionError";
  }
}

export class AttemptStateMachine {
  /**
   * Updates an existing draft's contents. Only permitted in DRAFT state.
   */
  static updateDraft(
    attempt: Attempt,
    content: Partial<StructuredTextSubmissionContent>
  ): Attempt {
    if (attempt.status !== "DRAFT") {
      throw new InvalidStateTransitionError(attempt.status, "updateDraft", ["DRAFT"]);
    }

    const now = new Date().toISOString();
    return {
      ...attempt,
      draftContent: {
        ...attempt.draftContent,
        ...content,
      },
      updatedAt: now,
    };
  }

  /**
   * Submits a draft attempt. Freezes the submission snapshot and moves to SUBMITTED.
   */
  static submit(
    attempt: Attempt,
    explicitContent?: StructuredTextSubmissionContent
  ): { attempt: Attempt; submission: Submission } {
    if (attempt.status !== "DRAFT") {
      throw new InvalidStateTransitionError(attempt.status, "submit", ["DRAFT"]);
    }

    const now = new Date().toISOString();
    const finalContent = explicitContent || attempt.draftContent;

    const submission: Submission = {
      id: `sub-${uuidv4()}`,
      attemptId: attempt.id,
      format: "STRUCTURED_TEXT",
      content: finalContent,
      submittedAt: now,
    };

    const updatedAttempt: Attempt = {
      ...attempt,
      status: "SUBMITTED",
      submission,
      draftContent: finalContent,
      submittedAt: now,
      updatedAt: now,
      errorMessage: null,
    };

    return { attempt: updatedAttempt, submission };
  }

  /**
   * Marks an attempt as EVALUATING. Allowed from SUBMITTED or FAILED (for re-evaluation).
   */
  static markEvaluating(attempt: Attempt): Attempt {
    const allowed = ["SUBMITTED", "FAILED"];
    if (!allowed.includes(attempt.status)) {
      throw new InvalidStateTransitionError(attempt.status, "markEvaluating", allowed);
    }

    const now = new Date().toISOString();
    return {
      ...attempt,
      status: "EVALUATING",
      errorMessage: null,
      updatedAt: now,
    };
  }

  /**
   * Completes evaluation and attaches the evaluation ID. Allowed only from EVALUATING.
   */
  static completeEvaluation(attempt: Attempt, evaluationId: string): Attempt {
    if (attempt.status !== "EVALUATING") {
      throw new InvalidStateTransitionError(attempt.status, "completeEvaluation", [
        "EVALUATING",
      ]);
    }

    const now = new Date().toISOString();
    return {
      ...attempt,
      status: "COMPLETED",
      evaluationId,
      completedAt: now,
      updatedAt: now,
      errorMessage: null,
    };
  }

  /**
   * Marks evaluation as failed. Preserves the submission so user can retry evaluation.
   */
  static failEvaluation(attempt: Attempt, errorMessage: string): Attempt {
    if (attempt.status !== "EVALUATING") {
      throw new InvalidStateTransitionError(attempt.status, "failEvaluation", [
        "EVALUATING",
      ]);
    }

    const now = new Date().toISOString();
    return {
      ...attempt,
      status: "FAILED",
      errorMessage,
      updatedAt: now,
    };
  }

  static canSubmit(attempt: Attempt): boolean {
    return attempt.status === "DRAFT";
  }

  static canEvaluate(attempt: Attempt): boolean {
    return attempt.status === "SUBMITTED" || attempt.status === "FAILED";
  }

  static canRetry(attempt: Attempt): boolean {
    return attempt.status === "COMPLETED" || attempt.status === "FAILED";
  }
}
