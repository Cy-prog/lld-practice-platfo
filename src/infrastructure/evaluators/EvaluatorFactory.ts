import { IEvaluator } from "./Evaluator";
import { MockEvaluator } from "./MockEvaluator";
import { GeminiAiEvaluator } from "./GeminiAiEvaluator";

export class EvaluatorFactory {
  static createEvaluator(modeOverride?: "gemini" | "mock"): IEvaluator {
    const mode = (modeOverride || process.env.EVALUATOR_MODE || "mock").toLowerCase();
    const apiKey = process.env.GEMINI_API_KEY;

    if (mode === "gemini") {
      // In Gemini mode, instantiate GeminiAiEvaluator. If API key is omitted, it will throw a descriptive configuration error.
      return new GeminiAiEvaluator(apiKey);
    }

    // Default to MockEvaluator for deterministic, offline, and reliable demos
    return new MockEvaluator();
  }
}
