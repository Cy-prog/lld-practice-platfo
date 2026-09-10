export type SubmissionFormat = "STRUCTURED_TEXT" | "CLASS_DIAGRAM" | "CODE";

export type RelationshipType =
  | "ASSOCIATION"
  | "COMPOSITION"
  | "AGGREGATION"
  | "INHERITANCE"
  | "DEPENDENCY";

export interface ClassEntity {
  id?: string;
  name: string;
  responsibility: string;
  attributes: string[];
  methods: string[];
}

export interface InterfaceEntity {
  id?: string;
  name: string;
  responsibility: string;
  methods: string[];
  rationale: string;
}

export interface Relationship {
  id?: string;
  from: string;
  to: string;
  type: RelationshipType;
  explanation: string;
}

export interface Workflow {
  id?: string;
  name: string;
  steps: string[];
}

export interface DesignPatternUsage {
  id?: string;
  pattern: string;
  appliedTo: string;
  rationale: string;
}

export interface StructuredTextSubmissionContent {
  assumptions: string;
  classes: ClassEntity[];
  interfaces: InterfaceEntity[];
  relationships: Relationship[];
  workflows: Workflow[];
  designPatterns: DesignPatternUsage[];
  extensibility: string;
  edgeCases: string;
  explanation: string;
}

export interface ISubmission<T = StructuredTextSubmissionContent> {
  id: string;
  attemptId: string;
  format: SubmissionFormat;
  content: T;
  submittedAt: string;
}

export type Submission = ISubmission<StructuredTextSubmissionContent>;
