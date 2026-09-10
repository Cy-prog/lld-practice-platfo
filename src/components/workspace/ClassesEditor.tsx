"use client";

import React, { useState } from "react";
import { Plus, Trash2, Box, HelpCircle } from "lucide-react";
import { ClassEntity } from "@/domain/models/Submission";

interface ClassesEditorProps {
  classes: ClassEntity[];
  onChange: (classes: ClassEntity[]) => void;
}

export default function ClassesEditor({ classes, onChange }: ClassesEditorProps) {
  const addClass = () => {
    onChange([
      ...classes,
      {
        id: `class-${Date.now()}`,
        name: "",
        responsibility: "",
        attributes: [],
        methods: [],
      },
    ]);
  };

  const removeClass = (index: number) => {
    const updated = classes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateClass = (index: number, patch: Partial<ClassEntity>) => {
    const updated = classes.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-400" />
            Core Classes & Entities
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Define major domain entities, their single core responsibility, and expected operations.
          </p>
        </div>
        <button
          type="button"
          onClick={addClass}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Entity
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <p className="text-xs text-slate-400">No classes defined yet. Add at least one major domain entity.</p>
          <button
            type="button"
            onClick={addClass}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add First Entity
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls, idx) => (
            <div
              key={cls.id || idx}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700/80 transition-all space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Class Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={cls.name}
                    onChange={(e) => updateClass(idx, { name: e.target.value })}
                    placeholder="e.g. ParkingLot, Vehicle, Ticket, ElevatorCar"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {classes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeClass(idx)}
                    className="mt-5 p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Responsibility (Single Responsibility Principle) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={cls.responsibility}
                  onChange={(e) => updateClass(idx, { responsibility: e.target.value })}
                  placeholder="What is this class's singular purpose? (e.g. 'Tracks occupancy state of a single parking spot and verifies dimension compatibility.')"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Key Attributes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(cls.attributes || []).join(", ")}
                    onChange={(e) =>
                      updateClass(idx, {
                        attributes: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="id: string, isOccupied: boolean, capacity: int"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Key Operations / Methods (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(cls.methods || []).join(", ")}
                    onChange={(e) =>
                      updateClass(idx, {
                        methods: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="assignSpot(Vehicle), vacate(), isAvailable(): boolean"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
