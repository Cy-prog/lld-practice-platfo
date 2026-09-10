import { IEvaluator } from "./Evaluator";
import { MockEvaluator } from "./MockEvaluator";
import { GeminiAiEvaluator } from "./GeminiAiEvaluator";

export class EvaluatorFactory {
  static createEvaluator(modeOverride?: "gemini" | "mock", apiKeyOverride?: string): IEvaluator {
    const apiKey = (apiKeyOverride || process.env.GEMINI_API_KEY || "").trim();
    // Auto-activate Gemini AI evaluator if an API key is available, or if explicitly requested
    const mode = (modeOverride || (apiKey ? "gemini" : (process.env.EVALUATOR_MODE || "mock"))).toLowerCase();

    if (mode === "gemini") {
      return new GeminiAiEvaluator(apiKey || undefined);
    }

    // Default to MockEvaluator for deterministic, offline, and reliable demos
    return new MockEvaluator();
  }
}
