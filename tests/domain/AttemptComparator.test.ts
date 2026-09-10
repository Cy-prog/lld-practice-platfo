import { describe, it, expect } from "vitest";
import { AttemptComparator } from "../../src/domain/services/AttemptComparator";
import { Evaluation } from "../../src/domain/models/Evaluation";

function createMockEval(
  id: string,
  overallScore: number,
  criteriaScores: Record<string, number>
): Evaluation {
  return {
    id,
    attemptId: "att-1",
    evaluatorType: "MOCK_DETERMINISTIC",
    overallScore,
    summary: "Mock summary",
    criteria: Object.entries(criteriaScores).map(([key, score]) => ({
      criterionKey: key as any,
      name: key,
      score,
      evidence: "evidence",
      concern: "concern",
      suggestion: "suggestion",
      confidence: 0.9,
    })),
    strengths: ["Strength 1"],
    improvements: ["Improvement 1"],
    nextPracticeFocus: "Focus on decoupling",
    confidence: 0.9,
    createdAt: new Date().toISOString(),
  };
}

describe("AttemptComparator", () => {
  it("computes positive score delta and identifies improved criteria", () => {
    const prev = createMockEval("eval-1", 65, {
      REQUIREMENT_UNDERSTANDING: 70,
      CLASS_RESPONSIBILITIES: 60,
      COUPLING_AND_COHESION: 65,
    });

    const curr = createMockEval("eval-2", 80, {
      REQUIREMENT_UNDERSTANDING: 85,
      CLASS_RESPONSIBILITIES: 80,
      COUPLING_AND_COHESION: 75,
    });

    const comparison = AttemptComparator.compare(curr, prev);

    expect(comparison.scoreDelta).toBe(15);
    expect(comparison.improvedCriteria.length).toBe(3);
    expect(comparison.regressedCriteria.length).toBe(0);
    expect(comparison.summary).toContain("+15 points");
  });

  it("detects regressed criteria and recurring weaknesses (<70)", () => {
    const prev = createMockEval("eval-1", 72, {
      CLASS_RESPONSIBILITIES: 65,
      EXTENSIBILITY: 60,
    });

    const curr = createMockEval("eval-2", 68, {
      CLASS_RESPONSIBILITIES: 62, // regressed & recurring
      EXTENSIBILITY: 68, // improved but recurring (<70)
    });

    const comparison = AttemptComparator.compare(curr, prev);

    expect(comparison.scoreDelta).toBe(-4);
    expect(comparison.regressedCriteria.length).toBe(1);
    expect(comparison.regressedCriteria[0].criterionKey).toBe("CLASS_RESPONSIBILITIES");
    expect(comparison.recurringWeaknesses.length).toBe(2);
  });
});
