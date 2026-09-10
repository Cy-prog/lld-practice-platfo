"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Lightbulb, ShieldCheck } from "lucide-react";
import { CriterionEvaluation } from "@/domain/models/Evaluation";
import { ScorePill } from "@/components/common/Badges";

export default function CriterionCard({ criterion }: { criterion: CriterionEvaluation }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all hover:border-slate-700/80">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-850/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ScorePill score={criterion.score} />
          <h4 className="font-semibold text-sm text-white tracking-tight">{criterion.name}</h4>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            Confidence: {Math.round(criterion.confidence * 100)}%
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 space-y-3.5 border-t border-slate-800/60 text-xs">
          {/* Evidence */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 font-medium text-slate-300 mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Evidence from your submission</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-5 font-mono text-[11px]">
              {criterion.evidence}
            </p>
          </div>

          {/* Concern */}
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40">
            <div className="flex items-center gap-1.5 font-medium text-amber-300 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Design Observation & Concern</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-5">{criterion.concern}</p>
          </div>

          {/* Suggestion */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
            <div className="flex items-center gap-1.5 font-medium text-emerald-300 mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              <span>Actionable Recommendation</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-5">{criterion.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
