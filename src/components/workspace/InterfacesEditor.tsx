"use client";

import React from "react";
import { Plus, Trash2, Layers } from "lucide-react";
import { InterfaceEntity } from "@/domain/models/Submission";

interface InterfacesEditorProps {
  interfaces: InterfaceEntity[];
  onChange: (interfaces: InterfaceEntity[]) => void;
}

export default function InterfacesEditor({ interfaces, onChange }: InterfacesEditorProps) {
  const addInterface = () => {
    onChange([
      ...interfaces,
      {
        id: `interface-${Date.now()}`,
        name: "",
        responsibility: "",
        methods: [],
        rationale: "",
      },
    ]);
  };

  const removeInterface = (index: number) => {
    onChange(interfaces.filter((_, i) => i !== index));
  };

  const updateInterface = (index: number, patch: Partial<InterfaceEntity>) => {
    onChange(interfaces.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Interfaces & Abstractions
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Define boundaries for dependency inversion and polymorphic variation (e.g. strategies, listeners, state contracts).
          </p>
        </div>
        <button
          type="button"
          onClick={addInterface}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-medium border border-purple-800/40 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Interface
        </button>
      </div>

      {interfaces.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
          <p className="text-xs text-slate-500">
            No interfaces defined yet. Adding abstractions decouples algorithms and supports the Open-Closed Principle.
          </p>
          <button
            type="button"
            onClick={addInterface}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Interface Contract
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {interfaces.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Interface Name
                  </label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateInterface(idx, { name: e.target.value })}
                    placeholder="e.g. IParkingStrategy, PaymentGateway, ElevatorSchedulingAlgorithm"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeInterface(idx)}
                  className="mt-5 p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove Interface"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Contract Methods (comma-separated)
                </label>
                <input
                  type="text"
                  value={(item.methods || []).join(", ")}
                  onChange={(e) =>
                    updateInterface(idx, {
                      methods: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="findSpot(VehicleType): ParkingSpot, releaseSpot(ParkingSpot): void"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Why does this abstraction exist? (Rationale)
                </label>
                <input
                  type="text"
                  value={item.rationale}
                  onChange={(e) => updateInterface(idx, { rationale: e.target.value })}
                  placeholder="e.g. Decouples parking lot management from specific spot search algorithms (Nearest vs Farthest)."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
