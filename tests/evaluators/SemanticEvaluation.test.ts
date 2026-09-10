import { describe, it, expect } from "vitest";
import { MockEvaluator } from "../../src/infrastructure/evaluators/MockEvaluator";
import { GeminiAiEvaluator } from "../../src/infrastructure/evaluators/GeminiAiEvaluator";
import { SEED_PROBLEMS } from "../../src/infrastructure/seed/seedProblems";
import { STANDARD_LLD_RUBRIC } from "../../src/domain/models/Rubric";
import { Submission } from "../../src/domain/models/Submission";

describe("Semantic Evaluation & Input Influence (Requirement 13)", () => {
  const parkingLotProblem = SEED_PROBLEMS.find((p) => p.id === "parking-lot")!;

  // Submission A: Monolithic God Class, high coupling, no interfaces, zero abstractions
  const weakSubmissionA: Submission = {
    id: "sub-weak-a",
    attemptId: "att-weak-a",
    format: "STRUCTURED_TEXT",
    submittedAt: new Date().toISOString(),
    content: {
      assumptions: "Everything is handled inside one central system class.",
      classes: [
        {
          id: "c1",
          name: "ParkingLotSystemManager",
          responsibility:
            "Orchestrates all gates, tracks spots, processes credit card transactions, calculates fees, and triggers hardware barrier motors.",
          attributes: [
            "spots: int[]",
            "cashRegister: double",
            "barrierOpen: boolean",
            "tickets: Map<string, string>",
          ],
          methods: [
            "parkVehicle()",
            "unparkVehicle()",
            "calculateFee()",
            "chargeCard()",
            "dispenseCashChange()",
            "openBarrier()",
            "closeBarrier()",
            "printTicket()",
          ],
        },
      ],
      interfaces: [],
      relationships: [],
      workflows: [
        {
          id: "w1",
          name: "Main Flow",
          steps: ["Call ParkingLotSystemManager to do everything"],
        },
      ],
      designPatterns: [],
      extensibility: "To add new vehicles we will add if/else conditions in ParkingLotSystemManager.",
      edgeCases: "Check if spots is full using an array counter.",
      explanation:
        "We centralized all application logic inside ParkingLotSystemManager for convenience and simplicity.",
    },
  };

  // Submission B: High Cohesion, Clean Single Responsibilities, Strategy Interfaces
  const strongSubmissionB: Submission = {
    id: "sub-strong-b",
    attemptId: "att-strong-b",
    format: "STRUCTURED_TEXT",
    submittedAt: new Date().toISOString(),
    content: {
      assumptions:
        "Multi-floor structure, asynchronous payment verification, hardware drivers abstracted behind gate adapters.",
      classes: [
        {
          id: "c1",
          name: "ParkingLot",
          responsibility: "Coordinates parking floors and entry/exit gates.",
          attributes: ["id: string", "floors: List<ParkingFloor>", "gates: List<Gate>"],
          methods: ["processEntry(Vehicle): Ticket", "processExit(Ticket): boolean"],
        },
        {
          id: "c2",
          name: "ParkingSpot",
          responsibility: "Maintains spot type and occupancy state for a single vehicle slot.",
          attributes: ["spotId: string", "type: SpotType", "isOccupied: boolean"],
          methods: ["occupy(Vehicle): void", "vacate(): void"],
        },
        {
          id: "c3",
          name: "PaymentService",
          responsibility: "Coordinates payment transactions and invoice generation.",
          attributes: ["pricingStrategy: IPricingStrategy", "gateway: IPaymentGateway"],
          methods: ["computeFee(Ticket): double", "processPayment(double, PaymentMethod): Receipt"],
        },
        {
          id: "c4",
          name: "Ticket",
          responsibility: "Immutable token representing an active parking session.",
          attributes: ["ticketId: string", "vehicleNumber: string", "entryTime: DateTime", "spotId: string"],
          methods: ["getDuration(): Duration"],
        },
      ],
      interfaces: [
        {
          id: "i1",
          name: "IParkingAllocationStrategy",
          responsibility: "Defines strategy contract for allocating optimal available spots.",
          methods: ["findAvailableSpot(VehicleType, List<ParkingFloor>): ParkingSpot"],
          rationale: "Decouples allocation algorithms (e.g. NearestToEntrance vs BestFit) from ParkingLot.",
        },
        {
          id: "i2",
          name: "IPricingStrategy",
          responsibility: "Calculates parking tariff based on spot tier, duration, and peak hours.",
          methods: ["calculateTariff(Duration, SpotType): double"],
          rationale: "Allows introducing dynamic surge pricing without altering payment orchestration.",
        },
      ],
      relationships: [
        {
          from: "ParkingLot",
          to: "ParkingSpot",
          type: "COMPOSITION",
          explanation: "Parking lot owns and manages lifecycle of parking spots across floors.",
        },
        {
          from: "PaymentService",
          to: "IPricingStrategy",
          type: "DEPENDENCY",
          explanation: "PaymentService depends on IPricingStrategy abstraction.",
        },
      ],
      workflows: [
        {
          id: "w1",
          name: "Vehicle Ingress",
          steps: [
            "Sensor detects vehicle at entry gate",
            "IParkingAllocationStrategy locates nearest compatible spot",
            "ParkingSpot marked reserved and unique Ticket issued",
            "Entry barrier raised upon ticket acceptance",
          ],
        },
      ],
      designPatterns: [
        {
          pattern: "Strategy Pattern",
          appliedTo: "IParkingAllocationStrategy & IPricingStrategy",
          rationale: "Enables runtime switching of spot allocation and pricing rules.",
        },
      ],
      extensibility:
        "New vehicle types, charging spot policies, or payment gateways can be introduced without modifying existing core domain classes (Open-Closed Principle).",
      edgeCases:
        "Race conditions on concurrent gate entries handled via atomic spot reservations. Lost tickets charged maximum tariff penalty.",
      explanation:
        "Separated core entities into focused domain models. Isolated fee calculation behind IPricingStrategy and spot allocation behind IParkingAllocationStrategy.",
    },
  };

  it("produces materially different, evidence-based feedback for weak vs strong submissions", async () => {
    const evaluator = new MockEvaluator();

    const [evalWeakA, evalStrongB] = await Promise.all([
      evaluator.evaluate({
        problem: parkingLotProblem,
        submission: weakSubmissionA,
        rubric: STANDARD_LLD_RUBRIC,
      }),
      evaluator.evaluate({
        problem: parkingLotProblem,
        submission: strongSubmissionB,
        rubric: STANDARD_LLD_RUBRIC,
      }),
    ]);

    // 1. Semantic Influence on Overall Score
    expect(evalStrongB.overallScore).toBeGreaterThan(evalWeakA.overallScore);
    const scoreDiff = evalStrongB.overallScore - evalWeakA.overallScore;
    expect(scoreDiff).toBeGreaterThanOrEqual(10); // Material score separation

    // 2. Class Responsibilities Criterion: Weak A must flag God Class
    const weakResp = evalWeakA.criteria.find((c) => c.criterionKey === "CLASS_RESPONSIBILITIES")!;
    const strongResp = evalStrongB.criteria.find((c) => c.criterionKey === "CLASS_RESPONSIBILITIES")!;

    expect(weakResp.score).toBeLessThan(strongResp.score);
    expect(weakResp.evidence.toLowerCase()).toContain("parkinglotsystemmanager");
    expect(weakResp.concern.toLowerCase()).toContain("god class");
    expect(weakResp.suggestion.toLowerCase()).toContain("decompose");

    // 3. Coupling & Cohesion Criterion: Strong B must recognize interfaces
    const weakCoupling = evalWeakA.criteria.find((c) => c.criterionKey === "COUPLING_AND_COHESION")!;
    const strongCoupling = evalStrongB.criteria.find((c) => c.criterionKey === "COUPLING_AND_COHESION")!;

    expect(strongCoupling.score).toBeGreaterThan(weakCoupling.score);
    expect(strongCoupling.evidence).toContain("IParkingAllocationStrategy");
    expect(weakCoupling.concern.toLowerCase()).toContain("concrete coupling");

    // 4. Encapsulation & Interfaces Criterion
    const weakEnc = evalWeakA.criteria.find((c) => c.criterionKey === "ENCAPSULATION_AND_INTERFACES")!;
    const strongEnc = evalStrongB.criteria.find((c) => c.criterionKey === "ENCAPSULATION_AND_INTERFACES")!;

    expect(strongEnc.score).toBeGreaterThan(weakEnc.score);

    // 5. Next Practice Focus must be distinct and specific to candidate's weaknesses
    expect(evalWeakA.nextPracticeFocus).toContain("ParkingLotSystemManager");
    expect(evalWeakA.nextPracticeFocus).not.toEqual(evalStrongB.nextPracticeFocus);
  });

  describe("GeminiAiEvaluator Boundary & Parsing Resilience", () => {
    it("throws a clear configuration error when GEMINI_API_KEY is not configured", async () => {
      const evaluator = new GeminiAiEvaluator("");
      await expect(
        evaluator.evaluate({
          problem: parkingLotProblem,
          submission: strongSubmissionB,
          rubric: STANDARD_LLD_RUBRIC,
        })
      ).rejects.toThrow("GEMINI_API_KEY is not set");
    });

    it("robustly parses JSON wrapped in markdown code blocks with surrounding preamble text", () => {
      const evaluator = new GeminiAiEvaluator("dummy-key");
      const sampleLlmOutput = `
Here is my architectural evaluation of your submission:

\`\`\`json
{
  "overallScore": 82,
  "summary": "Well-structured design with clean interfaces.",
  "confidence": 0.93,
  "criteria": [
    {
      "criterionKey": "REQUIREMENT_UNDERSTANDING",
      "name": "Requirement Understanding",
      "score": 85,
      "evidence": "Captured all multi-level and vehicle constraints.",
      "concern": "None noted.",
      "suggestion": "Keep boundary rules clearly documented.",
      "confidence": 0.95
    },
    {
      "criterionKey": "CLASS_RESPONSIBILITIES",
      "name": "Class Responsibilities",
      "score": 80,
      "evidence": "Separated ParkingLot from ParkingSpot.",
      "concern": "Ensure Spot does not orchestrate payments.",
      "suggestion": "Keep state isolated.",
      "confidence": 0.90
    }
  ],
  "strengths": ["Clean separation of concerns", "Good interface usage"],
  "improvements": ["Deepen concurrency documentation"],
  "nextPracticeFocus": "Focus on optimistic locking for spot allocation."
}
\`\`\`

I hope this helps you prepare for your LLD interview!
`;

      const result = evaluator.parseAndValidateResponse(sampleLlmOutput, "att-test-123");
      expect(result.overallScore).toBe(82);
      expect(result.summary).toBe("Well-structured design with clean interfaces.");
      expect(result.confidence).toBe(0.93);
      // Verify that all 8 criteria exist (missing ones backfilled)
      expect(result.criteria.length).toBe(8);
      expect(result.criteria.some((c) => c.criterionKey === "REQUIREMENT_UNDERSTANDING")).toBe(true);
      expect(result.criteria.some((c) => c.criterionKey === "CLASS_RESPONSIBILITIES")).toBe(true);
      expect(result.criteria.some((c) => c.criterionKey === "EXTENSIBILITY")).toBe(true);
    });

    it("rejects invalid or malformed non-JSON model outputs with descriptive error", () => {
      const evaluator = new GeminiAiEvaluator("dummy-key");
      const invalidOutput = "I cannot evaluate this design because the format is unreadable.";
      expect(() => evaluator.parseAndValidateResponse(invalidOutput, "att-123")).toThrow(
        "Failed to parse AI evaluator JSON output"
      );
    });
  });
});
