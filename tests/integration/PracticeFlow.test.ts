import { describe, it, expect, beforeEach } from "vitest";
import { FileBasedStorage } from "../../src/infrastructure/persistence/FileBasedStorage";
import {
  ProblemRepository,
  AttemptRepository,
  EvaluationRepository,
} from "../../src/infrastructure/persistence/Repositories";
import { ProblemService } from "../../src/application/services/ProblemService";
import { AttemptService } from "../../src/application/services/AttemptService";
import { EvaluationService } from "../../src/application/services/EvaluationService";
import { Problem } from "../../src/domain/models/Problem";
import { Attempt } from "../../src/domain/models/Attempt";
import { Evaluation } from "../../src/domain/models/Evaluation";

describe("End-to-End Practice Loop Integration", () => {
  let problemStorage: FileBasedStorage<Problem>;
  let attemptStorage: FileBasedStorage<Attempt>;
  let evaluationStorage: FileBasedStorage<Evaluation>;

  let problemRepo: ProblemRepository;
  let attemptRepo: AttemptRepository;
  let evalRepo: EvaluationRepository;

  let problemService: ProblemService;
  let attemptService: AttemptService;
  let evaluationService: EvaluationService;

  beforeEach(async () => {
    // Isolated in-memory/test collections
    problemStorage = new FileBasedStorage<Problem>("test_problems_" + Date.now());
    attemptStorage = new FileBasedStorage<Attempt>("test_attempts_" + Date.now());
    evaluationStorage = new FileBasedStorage<Evaluation>("test_evaluations_" + Date.now());

    problemRepo = new ProblemRepository(problemStorage);
    attemptRepo = new AttemptRepository(attemptStorage);
    evalRepo = new EvaluationRepository(evaluationStorage);

    problemService = new ProblemService(problemRepo, attemptRepo, evalRepo);
    attemptService = new AttemptService(attemptRepo, problemRepo);
    evaluationService = new EvaluationService(attemptRepo, problemRepo, evalRepo);
  });

  it("completes the entire practice loop: start -> draft -> validation -> evaluation -> retry -> comparison", async () => {
    // 1. Initialize seed problems
    await problemService.initializeSeedDataIfEmpty();
    const problems = await problemService.getAllProblems();
    expect(problems.length).toBe(5);

    const targetProblem = problems[0]; // Parking lot
    expect(targetProblem.status).toBe("NOT_STARTED");

    // 2. Start attempt #1
    const attempt1 = await attemptService.startAttempt(targetProblem.id);
    expect(attempt1.status).toBe("DRAFT");
    expect(attempt1.attemptNumber).toBe(1);

    // 3. Attempt invalid submission (empty classes)
    const invalidSubmit = await attemptService.submitAttempt(attempt1.id, {
      ...attempt1.draftContent,
      classes: [],
    });
    expect(invalidSubmit.validation.isValid).toBe(false);
    expect(invalidSubmit.attempt.status).toBe("DRAFT"); // Unchanged

    // 4. Update with complete valid submission
    const validContent = {
      assumptions: "Single payment currency, automated gates.",
      classes: [
        {
          id: "c1",
          name: "ParkingLot",
          responsibility: "Coordinates multi-floor operations and gate controls.",
          attributes: ["floors: Floor[]"],
          methods: ["parkVehicle()", "unparkVehicle()"],
        },
        {
          id: "c2",
          name: "ParkingSpot",
          responsibility: "Stores parking spot type and occupancy state.",
          attributes: ["isOccupied: boolean"],
          methods: ["occupy()", "vacate()"],
        },
      ],
      interfaces: [
        {
          id: "i1",
          name: "IParkingAllocationStrategy",
          responsibility: "Calculates best spot allocation.",
          methods: ["findSpot()"],
          rationale: "Decouples allocation logic from lot.",
        },
      ],
      relationships: [
        {
          from: "ParkingLot",
          to: "ParkingSpot",
          type: "COMPOSITION" as const,
          explanation: "Parking lot contains parking spots.",
        },
      ],
      workflows: [
        {
          id: "w1",
          name: "Vehicle Entry",
          steps: ["Scan plate", "Assign spot", "Print ticket"],
        },
      ],
      designPatterns: [
        {
          pattern: "Strategy Pattern",
          appliedTo: "IParkingAllocationStrategy",
          rationale: "Allows flexible allocation algorithms.",
        },
      ],
      extensibility: "New spots or pricing tiers can be added polymorphically.",
      edgeCases: "Handle parking full condition gracefully.",
      explanation: "Design prioritizes high cohesion and separates allocation strategy.",
    };

    const validSubmit = await attemptService.submitAttempt(attempt1.id, validContent);
    expect(validSubmit.validation.isValid).toBe(true);
    expect(validSubmit.attempt.status).toBe("SUBMITTED");
    expect(validSubmit.attempt.submission).not.toBeNull();

    // 5. Run Evaluation (using Mock evaluator for deterministic test)
    const evaluation1 = await evaluationService.evaluateAttempt(attempt1.id, "mock");
    expect(evaluation1.overallScore).toBeGreaterThanOrEqual(60);
    expect(evaluation1.criteria.length).toBe(8);

    const completedAttempt1 = await attemptService.getAttemptById(attempt1.id);
    expect(completedAttempt1?.status).toBe("COMPLETED");
    expect(completedAttempt1?.evaluationId).toBe(evaluation1.id);

    // 6. Retry Attempt -> creates Attempt #2
    const attempt2 = await attemptService.retryAttempt(attempt1.id);
    expect(attempt2.id).not.toBe(attempt1.id);
    expect(attempt2.attemptNumber).toBe(2);
    expect(attempt2.status).toBe("DRAFT");
    // Verify previous content was cloned
    expect(attempt2.draftContent.classes.length).toBe(validContent.classes.length);

    // Verify Attempt #1 was NOT modified by the retry
    const reloadedAttempt1 = await attemptService.getAttemptById(attempt1.id);
    expect(reloadedAttempt1?.status).toBe("COMPLETED");
    expect(reloadedAttempt1?.evaluationId).toBe(evaluation1.id);

    // 7. Improve Attempt #2 by adding PaymentService
    const improvedContent = {
      ...attempt2.draftContent,
      classes: [
        ...attempt2.draftContent.classes,
        {
          id: "c3",
          name: "PaymentService",
          responsibility: "Handles payment transactions and invoice generation.",
          attributes: ["gateway: PaymentGateway"],
          methods: ["processPayment()"],
        },
      ],
      explanation: "Improved design by adding dedicated PaymentService, further reducing coupling on ParkingLot.",
    };

    const submit2 = await attemptService.submitAttempt(attempt2.id, improvedContent);
    expect(submit2.validation.isValid).toBe(true);
    expect(submit2.attempt.status).toBe("SUBMITTED");

    const evaluation2 = await evaluationService.evaluateAttempt(attempt2.id, "mock");
    expect(evaluation2.overallScore).toBeGreaterThanOrEqual(60);

    // 8. Compare Attempt #2 with Attempt #1
    const comparison = await evaluationService.getAttemptComparison(attempt2.id);
    expect(comparison).not.toBeNull();
    expect(comparison?.previousScore).toBe(evaluation1.overallScore);
    expect(comparison?.currentScore).toBe(evaluation2.overallScore);
    expect(comparison?.criterionComparisons.length).toBe(8);
  });
});
