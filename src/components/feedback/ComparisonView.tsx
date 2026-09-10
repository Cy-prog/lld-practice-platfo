import React from "react";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles } from "lucide-react";
import { AttemptComparisonResult } from "@/domain/services/AttemptComparator";

export default function ComparisonView({ comparison }: { comparison: AttemptComparisonResult }) {
  const isPositive = comparison.scoreDelta > 0;
  const isNegative = comparison.scoreDelta < 0;

  return (
    <div className="p-6 rounded-2xl border border-blue-800/40 bg-gradient-to-b from-blue-950/20 to-slate-900/60 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-semibold text-white">
              Comparative Analysis with Previous Attempt
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{comparison.summary}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Score Progression</span>
            <span className="text-sm font-mono text-slate-300">
              {comparison.previousScore} → {comparison.currentScore}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${
              isPositive
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-700/60"
                : isNegative
                ? "bg-rose-950/60 text-rose-400 border-rose-700/60"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : isNegative ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            <span>{comparison.scoreDelta > 0 ? `+${comparison.scoreDelta}` : comparison.scoreDelta}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Improved criteria */}
        <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 space-y-2">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Improved Criteria ({comparison.improvedCriteria.length})
          </h4>
          {comparison.improvedCriteria.length === 0 ? (
            <p className="text-xs text-slate-500">No criteria scored higher than previous attempt.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {comparison.improvedCriteria.map((c) => (
                <li key={c.criterionKey} className="flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="font-mono text-emerald-400">
                    {c.previousScore} → {c.currentScore} (+{c.delta})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Regressed criteria */}
        <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-2">
          <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            Regressed Criteria ({comparison.regressedCriteria.length})
          </h4>
          {comparison.regressedCriteria.length === 0 ? (
            <p className="text-xs text-slate-500">No criteria regressed.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {comparison.regressedCriteria.map((c) => (
                <li key={c.criterionKey} className="flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="font-mono text-rose-400">
                    {c.previousScore} → {c.currentScore} ({c.delta})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recurring Weaknesses */}
      {comparison.recurringWeaknesses.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h5 className="text-xs font-semibold text-amber-300">
              Recurring Focus Areas Across Attempts
            </h5>
            <p className="text-xs text-slate-300 mt-0.5">
              The following criteria scored below 70 across both attempts:{" "}
              <span className="font-medium text-amber-200">
                {comparison.recurringWeaknesses.map((w) => w.name).join(", ")}
              </span>
              . Prioritize these specific skills in your next design iteration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
