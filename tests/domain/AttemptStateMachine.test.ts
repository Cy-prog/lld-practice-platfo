import { describe, it, expect } from "vitest";
import {
  AttemptStateMachine,
  InvalidStateTransitionError,
} from "../../src/domain/services/AttemptStateMachine";
import { Attempt, createInitialDraftContent } from "../../src/domain/models/Attempt";

function createTestAttempt(status: Attempt["status"] = "DRAFT"): Attempt {
  return {
    id: "test-att-1",
    problemId: "parking-lot",
    attemptNumber: 1,
    status,
    draftContent: createInitialDraftContent(),
    submission: null,
    evaluationId: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedAt: null,
    completedAt: null,
  };
}

describe("AttemptStateMachine", () => {
  it("allows updating draft when in DRAFT state", () => {
    const attempt = createTestAttempt("DRAFT");
    const updated = AttemptStateMachine.updateDraft(attempt, {
      assumptions: "Single entrance, 2 levels.",
    });

    expect(updated.draftContent.assumptions).toBe("Single entrance, 2 levels.");
    expect(updated.status).toBe("DRAFT");
  });

  it("rejects updating draft when not in DRAFT state", () => {
    const attempt = createTestAttempt("SUBMITTED");
    expect(() =>
      AttemptStateMachine.updateDraft(attempt, { assumptions: "Changed" })
    ).toThrow(InvalidStateTransitionError);
  });

  it("submits a draft attempt and freezes submission snapshot", () => {
    const attempt = createTestAttempt("DRAFT");
    const { attempt: submitted, submission } = AttemptStateMachine.submit(attempt);

    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.submittedAt).toBeDefined();
    expect(submitted.submission).not.toBeNull();
    expect(submission.attemptId).toBe(attempt.id);
  });

  it("rejects submitting an already submitted attempt", () => {
    const attempt = createTestAttempt("SUBMITTED");
    expect(() => AttemptStateMachine.submit(attempt)).toThrow(
      InvalidStateTransitionError
    );
  });

  it("marks a SUBMITTED attempt as EVALUATING", () => {
    const attempt = createTestAttempt("SUBMITTED");
    const evaluating = AttemptStateMachine.markEvaluating(attempt);

    expect(evaluating.status).toBe("EVALUATING");
    expect(evaluating.errorMessage).toBeNull();
  });

  it("rejects marking DRAFT as EVALUATING directly", () => {
    const attempt = createTestAttempt("DRAFT");
    expect(() => AttemptStateMachine.markEvaluating(attempt)).toThrow(
      InvalidStateTransitionError
    );
  });

  it("allows marking FAILED attempt as EVALUATING for retry", () => {
    const attempt = createTestAttempt("FAILED");
    const evaluating = AttemptStateMachine.markEvaluating(attempt);

    expect(evaluating.status).toBe("EVALUATING");
  });

  it("completes evaluation and attaches evaluationId", () => {
    const attempt = createTestAttempt("EVALUATING");
    const completed = AttemptStateMachine.completeEvaluation(attempt, "eval-123");

    expect(completed.status).toBe("COMPLETED");
    expect(completed.evaluationId).toBe("eval-123");
    expect(completed.completedAt).toBeDefined();
  });

  it("records evaluation failure and preserves state for retry", () => {
    const attempt = createTestAttempt("EVALUATING");
    const failed = AttemptStateMachine.failEvaluation(attempt, "API timeout");

    expect(failed.status).toBe("FAILED");
    expect(failed.errorMessage).toBe("API timeout");
  });

  it("correctly identifies lifecycle action capabilities", () => {
    const draft = createTestAttempt("DRAFT");
    expect(AttemptStateMachine.canSubmit(draft)).toBe(true);
    expect(AttemptStateMachine.canEvaluate(draft)).toBe(false);
    expect(AttemptStateMachine.canRetry(draft)).toBe(false);

    const completed = createTestAttempt("COMPLETED");
    expect(AttemptStateMachine.canSubmit(completed)).toBe(false);
    expect(AttemptStateMachine.canEvaluate(completed)).toBe(false);
    expect(AttemptStateMachine.canRetry(completed)).toBe(true);
  });
});
