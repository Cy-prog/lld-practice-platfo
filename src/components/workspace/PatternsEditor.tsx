"use client";

import React from "react";
import { Plus, Trash2, Cpu } from "lucide-react";
import { DesignPatternUsage } from "@/domain/models/Submission";

interface PatternsEditorProps {
  patterns: DesignPatternUsage[];
  onChange: (patterns: DesignPatternUsage[]) => void;
}

export default function PatternsEditor({ patterns, onChange }: PatternsEditorProps) {
  const addPattern = () => {
    onChange([
      ...patterns,
      {
        id: `pat-${Date.now()}`,
        pattern: "Strategy Pattern",
        appliedTo: "",
        rationale: "",
      },
    ]);
  };

  const removePattern = (index: number) => {
    onChange(patterns.filter((_, i) => i !== index));
  };

  const updatePattern = (index: number, patch: Partial<DesignPatternUsage>) => {
    onChange(patterns.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            Design Patterns (Optional & Justified)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Do not force patterns. Only include patterns where they genuinely solve variation or decoupling.
          </p>
        </div>
        <button
          type="button"
          onClick={addPattern}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-amber-800/40 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Pattern
        </button>
      </div>

      {patterns.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
          <p className="text-xs text-slate-500">
            No design patterns added. If your solution uses Strategy, State, Observer, or Factory, document it here.
          </p>
          <button
            type="button"
            onClick={addPattern}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Pattern Usage
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {patterns.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition-all space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Pattern
                  </label>
                  <input
                    type="text"
                    value={item.pattern}
                    onChange={(e) => updatePattern(idx, { pattern: e.target.value })}
                    placeholder="e.g. Strategy, State, Observer, Factory"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-7">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Applied To (Class / Interface)
                  </label>
                  <input
                    type="text"
                    value={item.appliedTo}
                    onChange={(e) => updatePattern(idx, { appliedTo: e.target.value })}
                    placeholder="e.g. SpotAllocationStrategy / ParkingLot"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removePattern(idx)}
                    className="mt-4 p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Why is this pattern appropriate?
                </label>
                <input
                  type="text"
                  value={item.rationale}
                  onChange={(e) => updatePattern(idx, { rationale: e.target.value })}
                  placeholder="e.g. Allows swapping nearest-spot and lowest-floor allocation without modifying parking lot orchestrator."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
