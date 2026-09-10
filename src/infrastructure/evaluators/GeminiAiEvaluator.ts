import { IEvaluator, EvaluationContext } from "./Evaluator";
import { Evaluation, CriterionEvaluation } from "../../domain/models/Evaluation";
import { RubricCriterionKey, STANDARD_LLD_RUBRIC } from "../../domain/models/Rubric";
import { v4 as uuidv4 } from "uuid";

export class GeminiAiEvaluator implements IEvaluator {
  readonly type = "AI_GEMINI" as const;
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.modelName = modelName || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  async evaluate(context: EvaluationContext): Promise<Evaluation> {
    if (!this.apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Please set the environment variable in .env.local or use EVALUATOR_MODE=mock."
      );
    }

    const { problem, submission, rubric } = context;
    const prompt = this.buildPrompt(problem, submission, rubric);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(45000), // 45-second timeout to prevent indefinite hangs
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                overallScore: { type: "INTEGER" },
                summary: { type: "STRING" },
                confidence: { type: "NUMBER" },
                criteria: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      criterionKey: { type: "STRING" },
                      name: { type: "STRING" },
                      score: { type: "INTEGER" },
                      evidence: { type: "STRING" },
                      concern: { type: "STRING" },
                      suggestion: { type: "STRING" },
                      confidence: { type: "NUMBER" },
                    },
                    required: [
                      "criterionKey",
                      "name",
                      "score",
                      "evidence",
                      "concern",
                      "suggestion",
                      "confidence",
                    ],
                  },
                },
                strengths: { type: "ARRAY", items: { type: "STRING" } },
                improvements: { type: "ARRAY", items: { type: "STRING" } },
                nextPracticeFocus: { type: "STRING" },
              },
              required: [
                "overallScore",
                "summary",
                "confidence",
                "criteria",
                "strengths",
                "improvements",
                "nextPracticeFocus",
              ],
            },
          },
        }),
      });
    } catch (err: any) {
      if (err.name === "TimeoutError") {
        throw new Error(
          `Gemini API request timed out after 45 seconds using model '${this.modelName}'. Check network or retry.`
        );
      }
      throw new Error(`Gemini network request failed: ${err.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Gemini API authentication failed (${response.status}). Verify your GEMINI_API_KEY: ${errorText}`
        );
      } else if (response.status === 429) {
        throw new Error(
          `Gemini API rate limit or quota exceeded (${response.status}). Please wait before retrying or use EVALUATOR_MODE=mock.`
        );
      } else if (response.status === 404) {
        throw new Error(
          `Gemini model '${this.modelName}' not found (404). Check GEMINI_MODEL in .env.local: ${errorText}`
        );
      }
      throw new Error(`Gemini API call failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error("Gemini API returned an empty response. The model may have blocked the prompt.");
    }

    return this.parseAndValidateResponse(candidate, submission.attemptId);
  }

  private buildPrompt(problem: any, submission: any, rubric: any): string {
    return `You are an expert Low-Level Design (LLD) and software architecture evaluator.
Your role is to provide rigorous, explainable, evidence-based feedback on a learner's LLD submission.

### CRITICAL EVALUATION RULES:
1. There can be multiple valid LLD solutions. Do NOT compare blindly against a single reference architecture.
2. Evaluate the submitted design strictly against the functional requirements and the evaluation rubric.
3. Reward reasonable trade-offs. If a learner chose simplicity over pattern complexity and explained why, acknowledge that choice.
4. Extract concrete evidence directly from the learner's submitted classes, methods, or explanations. Cite actual names they used.
5. Do NOT invent classes or behaviors that the learner did not submit.
6. Do NOT penalize a design simply because it differs from an imagined alternative.
7. Distinguish subjective design preferences from objective architectural flaws (such as tight coupling or violation of SRP).
8. Provide actionable, specific improvement advice.
9. Return ONLY valid JSON adhering exactly to the schema below.

### PROBLEM DEFINITION:
- Title: ${problem.title}
- Statement: ${problem.statement}
- Functional Requirements:
${problem.functionalRequirements.map((r: string) => `  * ${r}`).join("\n")}
- Business Rules & Constraints:
${problem.businessRules.map((r: string) => `  * ${r}`).join("\n")}
- Explicit Assumptions Allowed:
${problem.assumptions.map((a: string) => `  * ${a}`).join("\n")}

### LEARNER'S SUBMISSION EVIDENCE:
- Learner Assumptions: ${submission.content.assumptions || "None provided"}
- Core Classes & Responsibilities:
${(submission.content.classes || [])
  .map(
    (c: any) =>
      `  * Class: ${c.name}\n    - Responsibility: ${c.responsibility}\n    - Attributes: ${(c.attributes || []).join(", ") || "None"}\n    - Methods: ${(c.methods || []).join(", ") || "None"}`
  )
  .join("\n\n")}
- Interfaces & Abstractions:
${(submission.content.interfaces || [])
  .map(
    (i: any) =>
      `  * Interface: ${i.name}\n    - Responsibility: ${i.responsibility}\n    - Methods: ${(i.methods || []).join(", ") || "None"}\n    - Rationale: ${i.rationale}`
  )
  .join("\n\n")}
- Relationships:
${(submission.content.relationships || [])
  .map((r: any) => `  * ${r.from} --[${r.type}]--> ${r.to}: ${r.explanation}`)
  .join("\n")}
- Workflows:
${(submission.content.workflows || [])
  .map((w: any) => `  * Workflow '${w.name}':\n${(w.steps || []).map((s: string) => `      - ${s}`).join("\n")}`)
  .join("\n")}
- Design Patterns Used:
${(submission.content.designPatterns || [])
  .map((p: any) => `  * Pattern: ${p.pattern} on '${p.appliedTo}': ${p.rationale}`)
  .join("\n")}
- Extensibility Rationale: ${submission.content.extensibility || "None"}
- Edge Cases Handled: ${submission.content.edgeCases || "None"}
- Overall Design Explanation: ${submission.content.explanation || "None"}

### RUBRIC CRITERIA TO EVALUATE (Evaluate all 8 independently):
1. REQUIREMENT_UNDERSTANDING ("Requirement Understanding")
2. CLASS_RESPONSIBILITIES ("Class Responsibilities")
3. COUPLING_AND_COHESION ("Coupling & Cohesion")
4. ENCAPSULATION_AND_INTERFACES ("Encapsulation & Interfaces")
5. ABSTRACTION_AND_PATTERNS ("Abstraction / Patterns")
6. EXTENSIBILITY ("Extensibility")
7. EDGE_CASES_AND_TESTABILITY ("Edge Cases & Testability")
8. EXPLANATION_AND_TRADEOFFS ("Explanation & Trade-offs")

### REQUIRED JSON OUTPUT SCHEMA:
{
  "overallScore": number (0-100),
  "summary": string (concise 2-3 sentence overview),
  "confidence": number (0.0 to 1.0),
  "criteria": [
    {
      "criterionKey": "REQUIREMENT_UNDERSTANDING" | "CLASS_RESPONSIBILITIES" | "COUPLING_AND_COHESION" | "ENCAPSULATION_AND_INTERFACES" | "ABSTRACTION_AND_PATTERNS" | "EXTENSIBILITY" | "EDGE_CASES_AND_TESTABILITY" | "EXPLANATION_AND_TRADEOFFS",
      "name": string,
      "score": number (0-100),
      "evidence": string (specific quote or reference to submitted code/design),
      "concern": string (why this aspect is weak or incomplete),
      "suggestion": string (concrete recommendation on how to improve),
      "confidence": number (0.0 to 1.0)
    }
  ],
  "strengths": [string, string, string],
  "improvements": [string, string, string],
  "nextPracticeFocus": string (a punchy, actionable recommendation for the next attempt)
}`;
  }

  public parseAndValidateResponse(rawJson: string, attemptId: string): Evaluation {
    let parsed: any;
    try {
      let cleanJson = rawJson.trim();
      // If wrapped in markdown ```json ... ```, extract content
      const fenceMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenceMatch) {
        cleanJson = fenceMatch[1].trim();
      } else {
        // Fallback: extract substring between first { and last }
        const firstBrace = cleanJson.indexOf("{");
        const lastBrace = cleanJson.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }
      }
      parsed = JSON.parse(cleanJson);
    } catch (err: any) {
      throw new Error(`Failed to parse AI evaluator JSON output: ${err.message}`);
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("AI response structure is not a valid JSON object.");
    }

    if (typeof parsed.overallScore !== "number" || !Array.isArray(parsed.criteria)) {
      throw new Error("AI response structure is missing required fields (overallScore, criteria).");
    }

    // Map criteria by key for validation & backfilling
    const criteriaMap = new Map<string, any>();
    for (const c of parsed.criteria) {
      if (c && c.criterionKey) {
        criteriaMap.set(c.criterionKey, c);
      }
    }

    // Ensure all 8 criteria defined in STANDARD_LLD_RUBRIC are present
    const validatedCriteria: CriterionEvaluation[] = STANDARD_LLD_RUBRIC.criteria.map((def) => {
      const found = criteriaMap.get(def.key);
      if (found) {
        return {
          criterionKey: def.key,
          name: found.name || def.displayName,
          score: Math.min(100, Math.max(0, Math.round(Number(found.score) || 0))),
          evidence: String(found.evidence || "Submitted design elements evaluated."),
          concern: String(found.concern || "No critical concerns noted."),
          suggestion: String(found.suggestion || "Continue refining interface contracts."),
          confidence: Math.min(1.0, Math.max(0.0, Number(found.confidence) || 0.9)),
        };
      }
      // Backfill missing criterion cleanly
      return {
        criterionKey: def.key,
        name: def.displayName,
        score: Math.min(100, Math.max(0, Math.round(parsed.overallScore))),
        evidence: "Evaluated from overall submission context.",
        concern: "Criterion evaluated as part of broad architecture review.",
        suggestion: `Continue adhering to ${def.displayName} best practices.`,
        confidence: 0.85,
      };
    });

    return {
      id: `eval-${uuidv4()}`,
      attemptId,
      evaluatorType: this.type,
      overallScore: Math.min(100, Math.max(0, Math.round(parsed.overallScore))),
      summary: String(parsed.summary || "LLD evaluation completed successfully."),
      criteria: validatedCriteria,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
      nextPracticeFocus: String(
        parsed.nextPracticeFocus || "Focus on decoupling business logic from orchestration classes."
      ),
      confidence: Math.min(1.0, Math.max(0.0, Number(parsed.confidence) || 0.9)),
      createdAt: new Date().toISOString(),
    };
  }
}
