import { describe, it, expect } from "vitest";
import { DeterministicValidator } from "../../src/infrastructure/validation/DeterministicValidator";
import { StructuredTextSubmissionContent } from "../../src/domain/models/Submission";

describe("DeterministicValidator", () => {
  const validSubmission: StructuredTextSubmissionContent = {
    assumptions: "Single currency USD, 3 parking floors.",
    classes: [
      {
        id: "c1",
        name: "ParkingLot",
        responsibility: "Coordinates floors, gates, and spot allocation logic.",
        attributes: ["id: string", "floors: List<Floor>"],
        methods: ["parkVehicle(Vehicle): Ticket", "unparkVehicle(Ticket): boolean"],
      },
      {
        id: "c2",
        name: "ParkingSpot",
        responsibility: "Maintains spot status and assigned vehicle type.",
        attributes: ["spotNumber: int", "isOccupied: boolean"],
        methods: ["assignVehicle(Vehicle): void", "vacate(): void"],
      },
    ],
    interfaces: [
      {
        id: "i1",
        name: "IParkingStrategy",
        responsibility: "Defines strategy contract for allocating parking spots.",
        methods: ["findSpot(VehicleType): ParkingSpot"],
        rationale: "Allows swapping between nearest-to-gate and best-fit strategies.",
      },
    ],
    relationships: [
      {
        from: "ParkingLot",
        to: "ParkingSpot",
        type: "COMPOSITION",
        explanation: "ParkingLot owns and manages lifetimes of parking spots.",
      },
    ],
    workflows: [
      {
        id: "w1",
        name: "Entry & Parking",
        steps: [
          "Vehicle arrives at entry gate",
          "Scanner identifies vehicle type",
          "Strategy allocates optimal spot",
          "Ticket is generated and gate opens",
        ],
      },
    ],
    designPatterns: [
      {
        pattern: "Strategy",
        appliedTo: "IParkingStrategy",
        rationale: "Decouples allocation logic from ParkingLot.",
      },
    ],
    extensibility: "New vehicle types can be added by implementing new Spot types and strategy handlers.",
    edgeCases: "Handle parking full condition gracefully by displaying lot full sign at gate.",
    explanation: "This design separates spot allocation from vehicle representation and uses Strategy pattern.",
  };

  it("passes validation with comprehensive submission", () => {
    const result = DeterministicValidator.validate(validSubmission);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("fails validation when classes are missing", () => {
    const invalid = { ...validSubmission, classes: [] };
    const result = DeterministicValidator.validate(invalid);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "At least one core class/entity must be specified in the design."
    );
  });

  it("fails validation when class name or responsibility is missing", () => {
    const invalid = {
      ...validSubmission,
      classes: [{ name: "", responsibility: "Too", attributes: [], methods: [] }],
    };
    const result = DeterministicValidator.validate(invalid);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("missing a name"))).toBe(true);
    expect(result.errors.some((e) => e.includes("must specify a concrete responsibility"))).toBe(true);
  });

  it("fails validation when explanation is too short", () => {
    const invalid = { ...validSubmission, explanation: "Too short" };
    const result = DeterministicValidator.validate(invalid);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("explanation of at least 20 characters"))).toBe(true);
  });

  it("emits non-blocking warnings for omitted interfaces or assumptions", () => {
    const minimalValid = {
      ...validSubmission,
      assumptions: "",
      interfaces: [],
      edgeCases: "",
    };
    const result = DeterministicValidator.validate(minimalValid);
    expect(result.isValid).toBe(true); // Still valid
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("prevents submission if attempt is already EVALUATING or COMPLETED", () => {
    const resultEvaluating = DeterministicValidator.validate(validSubmission, {
      id: "att-1",
      problemId: "p1",
      attemptNumber: 1,
      status: "EVALUATING",
      draftContent: validSubmission,
      submission: null,
      evaluationId: null,
      errorMessage: null,
      createdAt: "",
      updatedAt: "",
      submittedAt: "",
      completedAt: null,
    });
    expect(resultEvaluating.isValid).toBe(false);
    expect(resultEvaluating.errors.some((e) => e.includes("already actively running"))).toBe(true);
  });
});
