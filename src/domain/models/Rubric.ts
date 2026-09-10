export type RubricCriterionKey =
  | "REQUIREMENT_UNDERSTANDING"
  | "CLASS_RESPONSIBILITIES"
  | "COUPLING_AND_COHESION"
  | "ENCAPSULATION_AND_INTERFACES"
  | "ABSTRACTION_AND_PATTERNS"
  | "EXTENSIBILITY"
  | "EDGE_CASES_AND_TESTABILITY"
  | "EXPLANATION_AND_TRADEOFFS";

export interface RubricCriterionDefinition {
  key: RubricCriterionKey;
  displayName: string;
  weight: number; // e.g. 0.125 each or custom
  description: string;
  evaluationGuide: string;
}

export interface Rubric {
  id: string;
  name: string;
  criteria: RubricCriterionDefinition[];
}

export const STANDARD_LLD_RUBRIC: Rubric = {
  id: "standard-lld-rubric-v1",
  name: "Standard Low-Level Design Rubric",
  criteria: [
    {
      key: "REQUIREMENT_UNDERSTANDING",
      displayName: "Requirement Understanding",
      weight: 0.15,
      description: "Did the learner correctly interpret the requirements and identify sensible assumptions?",
      evaluationGuide: "Look for explicit recognition of constraints, scope boundaries, and handling of ambiguous requirements.",
    },
    {
      key: "CLASS_RESPONSIBILITIES",
      displayName: "Class Responsibilities",
      weight: 0.15,
      description: "Are domain responsibilities cleanly partitioned without God classes (Single Responsibility)?",
      evaluationGuide: "Check that each class has a singular role. For example, a ParkingLot class should not compute payments and manage gates directly.",
    },
    {
      key: "COUPLING_AND_COHESION",
      displayName: "Coupling & Cohesion",
      weight: 0.15,
      description: "Are classes focused internally (high cohesion) and minimally dependent on internal details of other classes (low coupling)?",
      evaluationGuide: "Identify whether changes to one entity require cascading changes across unrelated entities.",
    },
    {
      key: "ENCAPSULATION_AND_INTERFACES",
      displayName: "Encapsulation & Interfaces",
      weight: 0.15,
      description: "Are internal details protected behind clean contracts and meaningful interfaces?",
      evaluationGuide: "Examine whether domain logic interacts through interfaces or concrete implementations, and if state is properly encapsulated.",
    },
    {
      key: "ABSTRACTION_AND_PATTERNS",
      displayName: "Abstraction / Patterns",
      weight: 0.1,
      description: "Are design patterns applied judiciously to solve real domain variation without over-engineering?",
      evaluationGuide: "Reward justified Strategy, Factory, Observer, or State patterns. Penalize forced or speculative patterns without clear benefit.",
    },
    {
      key: "EXTENSIBILITY",
      displayName: "Extensibility",
      weight: 0.1,
      description: "Can expected future business requirement evolutions be accommodated with minimal modification (Open-Closed)?",
      evaluationGuide: "Check how the architecture handles new vehicle types, payment methods, dispatch strategies, or pricing rules.",
    },
    {
      key: "EDGE_CASES_AND_TESTABILITY",
      displayName: "Edge Cases & Testability",
      weight: 0.1,
      description: "Are boundary conditions, concurrency, and failure paths addressed? Are components easily unit-testable?",
      evaluationGuide: "Look for handling of capacity limits, invalid states, concurrency/contention, and isolation of business logic for testing.",
    },
    {
      key: "EXPLANATION_AND_TRADEOFFS",
      displayName: "Explanation & Trade-offs",
      weight: 0.1,
      description: "Did the learner articulate rationale, architectural compromises, and alternative options considered?",
      evaluationGuide: "Assess depth of engineering communication and awareness of trade-offs (e.g. memory vs speed, simplicity vs future flexibility).",
    },
  ],
};
