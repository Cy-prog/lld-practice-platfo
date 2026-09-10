// tests/e2e-api-journey.mjs
// Verifies all HTTP endpoints, routes, and complete practice flow against running server http://localhost:3000

async function runE2E() {
  const baseUrl = "http://localhost:3000";
  console.log(`[E2E] Starting end-to-end journey verification on ${baseUrl}...`);

  // 1. Verify Homepage
  const homeRes = await fetch(`${baseUrl}/`);
  if (!homeRes.ok) throw new Error(`Homepage failed with status ${homeRes.status}`);
  console.log(`✓ 1. GET / (Homepage) -> HTTP ${homeRes.status}`);

  // 2. Verify Problems Library Page
  const probPageRes = await fetch(`${baseUrl}/problems`);
  if (!probPageRes.ok) throw new Error(`Problems page failed with status ${probPageRes.status}`);
  console.log(`✓ 2. GET /problems (Problem Library Page) -> HTTP ${probPageRes.status}`);

  // 3. Verify API Problems List
  const probApiRes = await fetch(`${baseUrl}/api/problems`);
  const probApiJson = await probApiRes.json();
  if (!probApiJson.success || probApiJson.data.length !== 5) {
    throw new Error(`Expected 5 problems, got ${probApiJson.data?.length}`);
  }
  console.log(`✓ 3. GET /api/problems -> 5 problems verified: ${probApiJson.data.map(p => p.id).join(", ")}`);

  const parkingLot = probApiJson.data[0];

  // 4. Start Attempt #1
  const startRes = await fetch(`${baseUrl}/api/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problemId: parkingLot.id }),
  });
  const startJson = await startRes.json();
  if (!startJson.success || !startJson.data.id) {
    throw new Error(`Failed to start attempt: ${startJson.error}`);
  }
  const attempt1Id = startJson.data.id;
  console.log(`✓ 4. POST /api/attempts -> Started Attempt #1 (${attempt1Id}), status: ${startJson.data.status}`);

  // 5. Test Deterministic Validation (Incomplete submission)
  const invalidSubmitRes = await fetch(`${baseUrl}/api/attempts/${attempt1Id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: {
        classes: [],
        explanation: "Short",
      },
    }),
  });
  const invalidSubmitJson = await invalidSubmitRes.json();
  if (invalidSubmitRes.status !== 422 || invalidSubmitJson.isValid) {
    throw new Error(`Expected 422 validation failure, got ${invalidSubmitRes.status}`);
  }
  console.log(`✓ 5. POST /api/attempts/${attempt1Id}/submit with invalid data -> HTTP 422 rejected with ${invalidSubmitJson.validation.errors.length} validation errors`);

  // 6. Complete Valid Submission for Attempt #1
  const validSubmission1 = {
    assumptions: "Single payment currency USD, 3 parking floors, automated gates.",
    classes: [
      {
        id: "c1",
        name: "ParkingLot",
        responsibility: "Coordinates multi-floor parking operations and entry/exit gates.",
        attributes: ["floors: Floor[]", "gates: Gate[]"],
        methods: ["processEntry(Vehicle): Ticket", "processExit(Ticket): boolean"],
      },
      {
        id: "c2",
        name: "ParkingSpot",
        responsibility: "Tracks dimensions, vehicle compatibility, and occupancy state.",
        attributes: ["spotId: string", "isOccupied: boolean"],
        methods: ["occupy(Vehicle): void", "vacate(): void"],
      },
    ],
    interfaces: [
      {
        id: "i1",
        name: "IParkingAllocationStrategy",
        responsibility: "Contract for locating optimal parking spot.",
        methods: ["findSpot(VehicleType): ParkingSpot"],
        rationale: "Decouples allocation algorithm from ParkingLot.",
      },
    ],
    relationships: [
      {
        from: "ParkingLot",
        to: "ParkingSpot",
        type: "COMPOSITION",
        explanation: "ParkingLot owns spots.",
      },
    ],
    workflows: [
      {
        id: "w1",
        name: "Vehicle Ingress",
        steps: ["Scan plate", "Locate spot via strategy", "Issue ticket", "Open gate"],
      },
    ],
    designPatterns: [
      {
        pattern: "Strategy",
        appliedTo: "IParkingAllocationStrategy",
        rationale: "Allows pluggable spot search.",
      },
    ],
    extensibility: "New vehicle types or parking policies added via polymorphism.",
    edgeCases: "Display lot full sign when capacity is exhausted.",
    explanation: "This architecture decouples spot allocation strategy and isolates parking spot state.",
  };

  const submitRes1 = await fetch(`${baseUrl}/api/attempts/${attempt1Id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: validSubmission1 }),
  });
  const submitJson1 = await submitRes1.json();
  if (!submitJson1.success || submitJson1.data.attempt.status !== "SUBMITTED") {
    throw new Error(`Submission failed: ${submitJson1.error}`);
  }
  console.log(`✓ 6. POST /api/attempts/${attempt1Id}/submit -> Successfully submitted, status: ${submitJson1.data.attempt.status}`);

  // 7. Trigger Evaluation
  const evalRes1 = await fetch(`${baseUrl}/api/attempts/${attempt1Id}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "mock" }),
  });
  const evalJson1 = await evalRes1.json();
  if (!evalJson1.success || !evalJson1.data.criteria) {
    throw new Error(`Evaluation failed: ${evalJson1.error}`);
  }
  const eval1 = evalJson1.data;
  console.log(`✓ 7. POST /api/attempts/${attempt1Id}/evaluate -> Overall Score: ${eval1.overallScore}/100, Evaluator: ${eval1.evaluatorType}, Criteria count: ${eval1.criteria.length}`);

  // 8. Test Idempotency (Cannot evaluate already completed attempt)
  const duplicateEvalRes = await fetch(`${baseUrl}/api/attempts/${attempt1Id}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const duplicateEvalJson = await duplicateEvalRes.json();
  if (!duplicateEvalJson.success || duplicateEvalJson.data.id !== eval1.id) {
    throw new Error("Duplicate evaluation did not return existing completed evaluation idempotently.");
  }
  console.log(`✓ 8. Idempotency verified: re-evaluating completed attempt safely returns existing evaluation.`);

  // 9. Retry Attempt -> Create Attempt #2
  const retryRes = await fetch(`${baseUrl}/api/attempts/${attempt1Id}/retry`, {
    method: "POST",
  });
  const retryJson = await retryRes.json();
  if (!retryJson.success || retryJson.data.attemptNumber <= startJson.data.attemptNumber) {
    throw new Error(`Retry failed: ${retryJson.error || "Invalid attempt number"}`);
  }
  const attempt2Id = retryJson.data.id;
  console.log(`✓ 9. POST /api/attempts/${attempt1Id}/retry -> Created Attempt (id: ${attempt2Id}), attemptNumber: ${retryJson.data.attemptNumber}`);

  // 10. Improve Design on Attempt #2 (Add PaymentService & PricingStrategy)
  const improvedSubmission2 = {
    ...validSubmission1,
    classes: [
      ...validSubmission1.classes,
      {
        id: "c3",
        name: "PaymentService",
        responsibility: "Calculates fees and processes payments.",
        attributes: ["pricingStrategy: IPricingStrategy"],
        methods: ["computeFee(Ticket): double", "processPayment(): boolean"],
      },
    ],
    interfaces: [
      ...validSubmission1.interfaces,
      {
        id: "i2",
        name: "IPricingStrategy",
        responsibility: "Calculates tariff based on spot tier and duration.",
        methods: ["calculateTariff(Duration): double"],
        rationale: "Decouples pricing rules from payment service.",
      },
    ],
    explanation: "Iteration 2 adds a dedicated PaymentService and IPricingStrategy, eliminating coupling on ParkingLot.",
  };

  const submitRes2 = await fetch(`${baseUrl}/api/attempts/${attempt2Id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: improvedSubmission2 }),
  });
  const submitJson2 = await submitRes2.json();
  if (!submitJson2.success) throw new Error(`Submission 2 failed: ${submitJson2.error}`);
  console.log(`✓ 10. POST /api/attempts/${attempt2Id}/submit -> Attempt #2 submitted.`);

  // 11. Evaluate Attempt #2
  const evalRes2 = await fetch(`${baseUrl}/api/attempts/${attempt2Id}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "mock" }),
  });
  const evalJson2 = await evalRes2.json();
  const eval2 = evalJson2.data;
  console.log(`✓ 11. POST /api/attempts/${attempt2Id}/evaluate -> Overall Score: ${eval2.overallScore}/100`);

  // 12. Comparative Analysis (Attempt #2 vs Attempt #1)
  const compRes = await fetch(`${baseUrl}/api/attempts/${attempt2Id}/comparison`);
  const compJson = await compRes.json();
  if (!compJson.success || !compJson.data) throw new Error("Failed to generate comparison");
  const comp = compJson.data;
  console.log(`✓ 12. GET /api/attempts/${attempt2Id}/comparison -> Previous Score: ${comp.previousScore}, Current Score: ${comp.currentScore}, Delta: ${comp.scoreDelta >= 0 ? "+" + comp.scoreDelta : comp.scoreDelta}`);

  // 13. Dashboard Verification
  const dashRes = await fetch(`${baseUrl}/api/dashboard`);
  const dashJson = await dashRes.json();
  if (!dashJson.success) throw new Error("Failed to load dashboard");
  console.log(`✓ 13. GET /api/dashboard -> Total Problems: ${dashJson.data.totalProblems}, Practiced: ${dashJson.data.problemsPracticed}, Completed Attempts: ${dashJson.data.attemptsCompleted}, Average Score: ${dashJson.data.averageScore}/100`);

  console.log("\n==========================================");
  console.log("🏆 ALL 13 END-TO-END JOURNEY CHECKS PASSED!");
  console.log("==========================================");
}

runE2E().catch((err) => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
