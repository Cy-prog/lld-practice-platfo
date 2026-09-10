import {
  Submission,
  StructuredTextSubmissionContent,
} from "../../domain/models/Submission";
import { Attempt } from "../../domain/models/Attempt";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DeterministicValidator {
  /**
   * Validates a submission before evaluation.
   */
  static validate(
    submission: Submission | StructuredTextSubmissionContent,
    attempt?: Attempt
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Attempt status checks if attempt is provided
    if (attempt) {
      if (attempt.status === "EVALUATING") {
        errors.push("An evaluation is already actively running for this attempt.");
      }
      if (attempt.status === "COMPLETED" && attempt.evaluationId) {
        errors.push("This attempt has already been evaluated. Start a retry to evaluate a new iteration.");
      }
    }

    const content: StructuredTextSubmissionContent =
      "content" in submission ? submission.content : submission;

    if (!content) {
      return {
        isValid: false,
        errors: ["Submission payload is empty."],
        warnings: [],
      };
    }

    // 2. Class Entity checks
    if (!content.classes || content.classes.length === 0) {
      errors.push("At least one core class/entity must be specified in the design.");
    } else {
      content.classes.forEach((c, index) => {
        const classLabel = c.name?.trim() ? `Class '${c.name.trim()}'` : `Class #${index + 1}`;
        if (!c.name || c.name.trim().length === 0) {
          errors.push(`${classLabel} is missing a name.`);
        }
        if (!c.responsibility || c.responsibility.trim().length < 5) {
          errors.push(`${classLabel} must specify a concrete responsibility (at least 5 characters).`);
        }
        if (
          (!c.attributes || c.attributes.length === 0) &&
          (!c.methods || c.methods.length === 0)
        ) {
          warnings.push(`${classLabel} has neither attributes nor methods specified.`);
        }
      });
    }

    // 3. Overall explanation
    if (!content.explanation || content.explanation.trim().length < 20) {
      errors.push(
        "An overall design explanation of at least 20 characters is required to explain architectural trade-offs."
      );
    }

    // 4. Assumptions
    if (!content.assumptions || content.assumptions.trim().length < 10) {
      warnings.push(
        "Explicit domain assumptions were not provided or are very brief. Clarifying assumptions strengthens LLD evaluations."
      );
    }

    // 5. Workflows
    if (!content.workflows || content.workflows.length === 0) {
      warnings.push("No main workflows or interaction flows were described.");
    } else {
      content.workflows.forEach((w, idx) => {
        if (!w.name?.trim()) {
          warnings.push(`Workflow #${idx + 1} has no title.`);
        }
        if (!w.steps || w.steps.length === 0) {
          warnings.push(`Workflow '${w.name || idx + 1}' has no sequence steps.`);
        }
      });
    }

    // 6. Interfaces / Abstractions
    if (!content.interfaces || content.interfaces.length === 0) {
      warnings.push("No interfaces or abstractions defined. Consider using interfaces for dependency inversion.");
    }

    // 7. Edge Cases & Extensibility
    if (!content.edgeCases || content.edgeCases.trim().length < 10) {
      warnings.push("No edge cases documented. Resilient designs explicitly identify boundary failures.");
    }

    if (!content.extensibility || content.extensibility.trim().length < 10) {
      warnings.push("Extensibility handling was omitted. Consider how the system responds to requirement changes.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
