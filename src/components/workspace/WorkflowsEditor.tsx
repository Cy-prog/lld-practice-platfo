"use client";

import React from "react";
import { Plus, Trash2, ArrowRightLeft } from "lucide-react";
import { Workflow } from "@/domain/models/Submission";

interface WorkflowsEditorProps {
  workflows: Workflow[];
  onChange: (workflows: Workflow[]) => void;
}

export default function WorkflowsEditor({ workflows, onChange }: WorkflowsEditorProps) {
  const addWorkflow = () => {
    onChange([
      ...workflows,
      {
        id: `flow-${Date.now()}`,
        name: "",
        steps: [""],
      },
    ]);
  };

  const removeWorkflow = (index: number) => {
    onChange(workflows.filter((_, i) => i !== index));
  };

  const updateWorkflow = (index: number, patch: Partial<Workflow>) => {
    onChange(workflows.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addStep = (workflowIndex: number) => {
    const wf = workflows[workflowIndex];
    updateWorkflow(workflowIndex, { steps: [...wf.steps, ""] });
  };

  const removeStep = (workflowIndex: number, stepIndex: number) => {
    const wf = workflows[workflowIndex];
    updateWorkflow(workflowIndex, { steps: wf.steps.filter((_, i) => i !== stepIndex) });
  };

  const updateStep = (workflowIndex: number, stepIndex: number, text: string) => {
    const wf = workflows[workflowIndex];
    const steps = [...wf.steps];
    steps[stepIndex] = text;
    updateWorkflow(workflowIndex, { steps });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            Main System Workflows
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Demonstrate how classes interact sequentially to fulfill a key functional requirement (e.g. entry, checkout, dispatch).
          </p>
        </div>
        <button
          type="button"
          onClick={addWorkflow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-medium border border-blue-800/40 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
          <p className="text-xs text-slate-500">
            No workflows documented. Outlining execution paths proves that your class interfaces work together cohesively.
          </p>
          <button
            type="button"
            onClick={addWorkflow}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Primary Workflow
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf, wfIdx) => (
            <div
              key={wf.id || wfIdx}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Workflow Title
                  </label>
                  <input
                    type="text"
                    value={wf.name}
                    onChange={(e) => updateWorkflow(wfIdx, { name: e.target.value })}
                    placeholder="e.g. Vehicle Entry & Spot Assignment Flow"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeWorkflow(wfIdx)}
                  className="mt-5 p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove Workflow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase text-slate-400">
                  Sequential Steps
                </label>
                {wf.steps.map((step, stepIdx) => (
                  <div key={stepIdx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 w-5 text-right">
                      {stepIdx + 1}.
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => updateStep(wfIdx, stepIdx, e.target.value)}
                      placeholder={`Step ${stepIdx + 1}: e.g. Customer requests parking spot at entrance terminal`}
                      className="flex-1 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    {wf.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(wfIdx, stepIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addStep(wfIdx)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 pl-7 pt-1"
                >
                  <Plus className="w-3 h-3" /> Add Next Step
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
