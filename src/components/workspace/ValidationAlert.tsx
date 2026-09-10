import React from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { ValidationResult } from "@/infrastructure/validation/DeterministicValidator";

export default function ValidationAlert({ validation }: { validation: ValidationResult | null }) {
  if (!validation) return null;

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  if (!hasErrors && !hasWarnings) return null;

  return (
    <div className="space-y-3 mb-6">
      {hasErrors && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200">
          <div className="flex items-center gap-2 font-semibold text-sm text-rose-400 mb-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Deterministic Validation Errors ({validation.errors.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-300/90 pl-1">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {hasWarnings && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200">
          <div className="flex items-center gap-2 font-semibold text-sm text-amber-400 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Design Guidance & Advisory Checks ({validation.warnings.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-300/80 pl-1">
            {validation.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
