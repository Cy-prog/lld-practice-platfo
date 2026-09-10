import { IEvaluator, EvaluationContext } from "./Evaluator";
import { Evaluation, CriterionEvaluation } from "../../domain/models/Evaluation";
import { RubricCriterionKey } from "../../domain/models/Rubric";
import { v4 as uuidv4 } from "uuid";

export class MockEvaluator implements IEvaluator {
  readonly type = "MOCK_DETERMINISTIC" as const;

  async evaluate(context: EvaluationContext): Promise<Evaluation> {
    const { problem, submission, rubric } = context;
    const content = submission.content;

    const classNames = (content.classes || []).map((c) => c.name.trim()).filter(Boolean);
    const interfaceNames = (content.interfaces || []).map((i) => i.name.trim()).filter(Boolean);
    const hasInterfaces = interfaceNames.length > 0;
    const hasPatterns = (content.designPatterns || []).length > 0;
    const hasWorkflows = (content.workflows || []).length > 0;
    const hasEdgeCases = (content.edgeCases || "").trim().length > 25;
    const hasExtensibility = (content.extensibility || "").trim().length > 25;

    // Detect potential God Class or mixed responsibility
    const godClassCandidate = (content.classes || []).find((c) => {
      const resp = c.responsibility.toLowerCase();
      const name = c.name.toLowerCase();
      const methodCount = (c.methods || []).length;

      const hasGodClassNaming =
        name.includes("system") || name.includes("manager") || name.includes("controller");
      const hasTooManyMethods = methodCount >= 6;
      const isSoleMonolith = (content.classes || []).length === 1 && methodCount >= 4;
      const hasMultipleCommas = (resp.match(/,/g) || []).length >= 3;

      return (
        (hasGodClassNaming && hasTooManyMethods) ||
        (hasTooManyMethods && hasMultipleCommas) ||
        isSoleMonolith
      );
    });

    const criteriaEvaluations: CriterionEvaluation[] = [];

    // 1. REQUIREMENT UNDERSTANDING
    const hasAssumptions = (content.assumptions || "").trim().length > 20;
    const reqScore = hasAssumptions && classNames.length >= 3 ? 88 : classNames.length >= 2 ? 76 : 60;
    criteriaEvaluations.push({
      criterionKey: "REQUIREMENT_UNDERSTANDING",
      name: "Requirement Understanding",
      score: reqScore,
      evidence: hasAssumptions
        ? `Identified domain assumptions: "${content.assumptions.slice(0, 100)}..." and modeled ${classNames.length} core entities (${classNames.slice(0, 3).join(", ")}).`
        : `Modeled ${classNames.length} entities but left implicit domain assumptions unstated.`,
      concern: hasAssumptions
        ? "Ensure multi-vehicle edge constraints and capacity limits are explicitly defined in the assumption scope."
        : "Without written assumptions, boundary rules (such as spot allocation concurrency and pricing tiers) remain ambiguous.",
      suggestion:
        "Explicitly document capacity limits, payment timeout assumptions, and operational hours in the scoping phase.",
      confidence: 0.92,
    });

    // 2. CLASS RESPONSIBILITIES
    const respScore = godClassCandidate ? 68 : classNames.length >= 4 ? 85 : 72;
    criteriaEvaluations.push({
      criterionKey: "CLASS_RESPONSIBILITIES",
      name: "Class Responsibilities",
      score: respScore,
      evidence: godClassCandidate
        ? `Class '${godClassCandidate.name}' is assigned broad responsibilities: "${godClassCandidate.responsibility}".`
        : `Entities such as ${classNames.slice(0, 3).join(", ")} maintain focused operational responsibilities.`,
      concern: godClassCandidate
        ? `'${godClassCandidate.name}' risks becoming an anti-pattern God Class by coupling lifecycle orchestration with calculation details.`
        : "Check if data-holding entities also contain domain operations rather than behaving as passive DTOs.",
      suggestion: godClassCandidate
        ? `Decompose '${godClassCandidate.name}' by delegating auxiliary behaviors (e.g. calculation, persistence, or notifications) into dedicated service/strategy classes.`
        : "Continue keeping entities cohesive by enforcing rich domain behavior while isolating cross-cutting concerns.",
      confidence: 0.9,
    });

    // 3. COUPLING & COHESION
    const ccScore = hasInterfaces ? 84 : 70;
    criteriaEvaluations.push({
      criterionKey: "COUPLING_AND_COHESION",
      name: "Coupling & Cohesion",
      score: ccScore,
      evidence: hasInterfaces
        ? `Leveraged ${interfaceNames.length} interfaces (${interfaceNames.join(", ")}) to abstract cross-entity dependencies.`
        : `Entities communicate directly via concrete classes (${classNames.slice(0, 2).join(" -> ")}).`,
      concern: hasInterfaces
        ? "Ensure high cohesion within internal class methods so callers don't require knowledge of internal representation."
        : "Direct concrete coupling prevents substituting alternative domain strategies or swapping subsystems in isolation.",
      suggestion:
        "Introduce interface contracts at component boundaries so domain models depend on abstractions rather than concrete types.",
      confidence: 0.88,
    });

    // 4. ENCAPSULATION & INTERFACES
    const encScore = hasInterfaces && (content.interfaces || [])[0]?.methods?.length ? 86 : 68;
    criteriaEvaluations.push({
      criterionKey: "ENCAPSULATION_AND_INTERFACES",
      name: "Encapsulation & Interfaces",
      score: encScore,
      evidence: hasInterfaces
        ? `Declared interfaces with concrete contracts: ${interfaceNames.map((n) => `'${n}'`).join(", ")}.`
        : "No explicit interface abstractions were declared in the submission.",
      concern: hasInterfaces
        ? "Verify that state mutations are protected behind command methods rather than exposing raw getters/setters."
        : "Without interfaces, testing domain entities requires mocking concrete classes or instantiation of complex dependency trees.",
      suggestion:
        "Encapsulate state mutations within domain methods and define explicit public APIs on core abstractions.",
      confidence: 0.9,
    });

    // 5. ABSTRACTION / PATTERNS
    const patScore = hasPatterns ? 88 : hasInterfaces ? 74 : 64;
    criteriaEvaluations.push({
      criterionKey: "ABSTRACTION_AND_PATTERNS",
      name: "Abstraction / Patterns",
      score: patScore,
      evidence: hasPatterns
        ? `Documented pattern usage: ${content.designPatterns.map((p) => `'${p.pattern}' on '${p.appliedTo}'`).join("; ")}.`
        : hasInterfaces
        ? "Identified behavioral abstractions but did not formalize specific named Gang of Four patterns."
        : "Solution relies purely on basic procedural / OOP structure without design pattern abstractions.",
      concern: hasPatterns
        ? "Ensure pattern implementation remains focused on real domain variations rather than speculative complexity."
        : "Missing opportunities to leverage established patterns (e.g. Strategy for algorithm variants or State for lifecycle transitions).",
      suggestion:
        "Consider applying the Strategy pattern for variable calculations/allocations and the Observer or State pattern for status transitions.",
      confidence: 0.87,
    });

    // 6. EXTENSIBILITY
    const extScore = hasExtensibility ? 82 : 65;
    criteriaEvaluations.push({
      criterionKey: "EXTENSIBILITY",
      name: "Extensibility",
      score: extScore,
      evidence: hasExtensibility
        ? `Outlined extension rationale: "${content.extensibility.slice(0, 90)}...".`
        : "Extensibility handling was not elaborated in the design response.",
      concern: hasExtensibility
        ? "Review whether adding new requirement variants triggers changes in existing switch/case conditional blocks (violating OCP)."
        : "If the product team requests a new vehicle type, payment gateway, or dispatch rule, multiple core classes will require modification.",
      suggestion:
        "Apply the Open-Closed Principle (OCP) by using polymorphism and factory/strategy registries to register new behaviors without altering existing code.",
      confidence: 0.89,
    });

    // 7. EDGE CASES & TESTABILITY
    const edgeScore = hasEdgeCases ? 84 : 62;
    criteriaEvaluations.push({
      criterionKey: "EDGE_CASES_AND_TESTABILITY",
      name: "Edge Cases & Testability",
      score: edgeScore,
      evidence: hasEdgeCases
        ? `Addressed failure modes: "${content.edgeCases.slice(0, 90)}...".`
        : "Boundary conditions and edge failure scenarios were largely omitted.",
      concern: hasEdgeCases
        ? "Address race conditions during simultaneous resource acquisition (e.g., two requests claiming the last spot/inventory item concurrently)."
        : "Real-world systems frequently fail under concurrency contention, network timeouts, or full capacity thresholds.",
      suggestion:
        "Detail concurrency control (e.g. optimistic locking, atomic spot allocation, mutex guards) and demonstrate how components can be unit-tested with fake implementations.",
      confidence: 0.91,
    });

    // 8. EXPLANATION & TRADE-OFFS
    const expLength = (content.explanation || "").trim().length;
    const expScore = expLength > 150 ? 86 : expLength > 50 ? 74 : 60;
    criteriaEvaluations.push({
      criterionKey: "EXPLANATION_AND_TRADEOFFS",
      name: "Explanation & Trade-offs",
      score: expScore,
      evidence:
        expLength > 50
          ? `Submitted design explanation: "${content.explanation.slice(0, 100)}...".`
          : "Design explanation is sparse, providing limited visibility into trade-offs.",
      concern:
        expLength > 100
          ? "Deepen discussion of runtime complexity versus memory overhead and simplicity versus extensibility."
          : "Senior LLD interviews place high value on articulating WHY particular designs were chosen over alternatives.",
      suggestion:
        "Frame the design around trade-offs: compare your chosen approach against at least one plausible alternative and explain why your choice fits the problem constraints.",
      confidence: 0.93,
    });

    // Calculate weighted overall score
    let weightedScore = 0;
    let totalWeight = 0;
    for (const crit of criteriaEvaluations) {
      const def = rubric.criteria.find((c) => c.key === crit.criterionKey);
      const weight = def ? def.weight : 0.125;
      weightedScore += crit.score * weight;
      totalWeight += weight;
    }
    const overallScore = Math.round(weightedScore / (totalWeight || 1));

    const strengths: string[] = [
      `Clear entity modeling with ${classNames.length} domain classes (${classNames.slice(0, 3).join(", ")}) reflecting core problem vocabulary.`,
      hasWorkflows
        ? `Well-defined workflow sequence outlining system execution flow.`
        : `Direct and readable structure that maps to the functional requirements.`,
      hasInterfaces
        ? `Thoughtful interface abstractions (${interfaceNames.join(", ")}) supporting modularity.`
        : `Identified key business responsibilities within primary domain classes.`,
    ];

    const improvements: string[] = [
      godClassCandidate
        ? `Refactor '${godClassCandidate.name}' to adhere strictly to Single Responsibility by extracting sub-services.`
        : `Ensure domain state cannot be bypassed by introducing private fields with validated mutation methods.`,
      !hasInterfaces
        ? "Introduce interfaces for variable domain rules (such as pricing, allocation, or dispatch policies) to invert dependencies."
        : "Strengthen concurrency handling for shared state bottlenecks.",
      "Expand edge case coverage to include concurrent resource contention and graceful failure handling.",
    ];

    const nextPracticeFocus = godClassCandidate
      ? `On your next attempt, focus on separating business calculations and orchestration out of '${godClassCandidate.name}' into dedicated Strategy or Service objects.`
      : !hasInterfaces
      ? `On your next attempt, focus on defining at least two domain interfaces (e.g. Strategy or State patterns) to decouple core models.`
      : `On your next attempt, focus on rigorous concurrency handling and explaining trade-offs between simplicity and extensibility.`;

    return {
      id: `eval-${uuidv4()}`,
      attemptId: submission.attemptId,
      evaluatorType: this.type,
      overallScore,
      summary: `Solid foundational Low-Level Design for '${problem.title}'. The architecture identifies essential domain concepts and structures the primary workflow cleanly, with opportunities to deepen decoupling and concurrency resilience.`,
      criteria: criteriaEvaluations,
      strengths,
      improvements,
      nextPracticeFocus,
      confidence: 0.91,
      createdAt: new Date().toISOString(),
    };
  }
}
