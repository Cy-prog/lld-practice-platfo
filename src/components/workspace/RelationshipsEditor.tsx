"use client";

import React from "react";
import { Plus, Trash2, GitBranch } from "lucide-react";
import { Relationship, RelationshipType } from "@/domain/models/Submission";

interface RelationshipsEditorProps {
  relationships: Relationship[];
  onChange: (relationships: Relationship[]) => void;
}

export default function RelationshipsEditor({
  relationships,
  onChange,
}: RelationshipsEditorProps) {
  const addRelationship = () => {
    onChange([
      ...relationships,
      {
        id: `rel-${Date.now()}`,
        from: "",
        to: "",
        type: "COMPOSITION",
        explanation: "",
      },
    ]);
  };

  const removeRelationship = (index: number) => {
    onChange(relationships.filter((_, i) => i !== index));
  };

  const updateRelationship = (index: number, patch: Partial<Relationship>) => {
    onChange(relationships.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            Class & Interface Relationships
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Specify structural connections: composition (has-a lifecycle), aggregation (uses-a), inheritance (is-a), or dependency.
          </p>
        </div>
        <button
          type="button"
          onClick={addRelationship}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-emerald-800/40 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Relationship
        </button>
      </div>

      {relationships.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
          <p className="text-xs text-slate-500">
            No relationships specified. Outlining entity connections helps evaluators assess coupling and composition vs inheritance choices.
          </p>
          <button
            type="button"
            onClick={addRelationship}
            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Relationship Link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {relationships.map((rel, idx) => (
            <div
              key={rel.id || idx}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition-all space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    From (Source)
                  </label>
                  <input
                    type="text"
                    value={rel.from}
                    onChange={(e) => updateRelationship(idx, { from: e.target.value })}
                    placeholder="e.g. ParkingLot"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Relationship
                  </label>
                  <select
                    value={rel.type}
                    onChange={(e) =>
                      updateRelationship(idx, { type: e.target.value as RelationshipType })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="COMPOSITION">COMPOSITION (owns)</option>
                    <option value="AGGREGATION">AGGREGATION (contains)</option>
                    <option value="ASSOCIATION">ASSOCIATION (relates)</option>
                    <option value="INHERITANCE">INHERITANCE (is-a)</option>
                    <option value="DEPENDENCY">DEPENDENCY (uses)</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    To (Target)
                  </label>
                  <input
                    type="text"
                    value={rel.to}
                    onChange={(e) => updateRelationship(idx, { to: e.target.value })}
                    placeholder="e.g. ParkingSpot"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRelationship(idx)}
                    className="mt-4 p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={rel.explanation}
                  onChange={(e) => updateRelationship(idx, { explanation: e.target.value })}
                  placeholder="Explain why: e.g. ParkingLot controls the physical lifecycle and existence of spots."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
