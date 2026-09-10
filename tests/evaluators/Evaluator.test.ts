import { describe, it, expect } from "vitest";
import { MockEvaluator } from "../../src/infrastructure/evaluators/MockEvaluator";
import { EvaluatorFactory } from "../../src/infrastructure/evaluators/EvaluatorFactory";
import { SEED_PROBLEMS } from "../../src/infrastructure/seed/seedProblems";
import { STANDARD_LLD_RUBRIC } from "../../src/domain/models/Rubric";
import { Submission } from "../../src/domain/models/Submission";

describe("Evaluator Subsystem", () => {
  const problem = SEED_PROBLEMS[0]; // Parking Lot
  const submission: Submission = {
    id: "sub-1",
    attemptId: "att-1",
    format: "STRUCTURED_TEXT",
    submittedAt: new Date().toISOString(),
    content: {
      assumptions: "Single currency, multi-floor structure with standard spots.",
      classes: [
        {
          name: "ParkingLot",
          responsibility: "Manages overall parking lot operations, entrances, and exits.",
          attributes: ["id: string", "floors: List<Floor>"],
          methods: ["parkVehicle()", "unparkVehicle()"],
        },
        {
          name: "PaymentService",
          responsibility: "Calculates fees and coordinates payment gateways.",
          attributes: ["strategy: PricingStrategy"],
          methods: ["calculateFee()", "processPayment()"],
        },
      ],
      interfaces: [
        {
          name: "PricingStrategy",
          responsibility: "Calculates parking tariff based on vehicle type and duration.",
          methods: ["calculateFee(duration, vehicleType)"],
          rationale: "Allows flexible dynamic pricing and peak hour rates.",
        },
      ],
      relationships: [
        {
          from: "PaymentService",
          to: "PricingStrategy",
          type: "DEPENDENCY",
          explanation: "PaymentService depends on PricingStrategy abstraction.",
        },
      ],
      workflows: [
        {
          name: "Exit Workflow",
          steps: ["Present ticket", "Calculate fee via PaymentService", "Accept payment", "Open gate"],
        },
      ],
      designPatterns: [
        {
          pattern: "Strategy Pattern",
          appliedTo: "PricingStrategy",
          rationale: "Swapping pricing rules without altering payment orchestrator.",
        },
      ],
      extensibility: "New vehicle types or payment methods can be plugged in by creating new strategy classes.",
      edgeCases: "Handle lost tickets with a penalty rate, and concurrent exit attempts gracefully.",
      explanation: "Clean separation of concerns with isolated PaymentService and PricingStrategy interface.",
    },
  };

  it("MockEvaluator evaluates all 8 rubric criteria with evidence and actionable advice", async () => {
    const evaluator = new MockEvaluator();
    const result = await evaluator.evaluate({
      problem,
      submission,
      rubric: STANDARD_LLD_RUBRIC,
    });

    expect(result.evaluatorType).toBe("MOCK_DETERMINISTIC");
    expect(result.overallScore).toBeGreaterThanOrEqual(50);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.criteria.length).toBe(8);

    for (const crit of result.criteria) {
      expect(crit.score).toBeGreaterThanOrEqual(0);
      expect(crit.score).toBeLessThanOrEqual(100);
      expect(crit.evidence.length).toBeGreaterThan(5);
      expect(crit.suggestion.length).toBeGreaterThan(5);
      expect(crit.confidence).toBeGreaterThan(0);
    }

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.improvements.length).toBeGreaterThan(0);
    expect(result.nextPracticeFocus.length).toBeGreaterThan(10);
  });

  it("EvaluatorFactory safely creates MockEvaluator when in mock mode or API key missing", () => {
    const evaluator = EvaluatorFactory.createEvaluator("mock");
    expect(evaluator.type).toBe("MOCK_DETERMINISTIC");
  });
});
