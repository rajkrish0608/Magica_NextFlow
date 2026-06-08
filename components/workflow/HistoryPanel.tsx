"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { useWorkflowStore } from "@/store/workflow-store";

interface NodeResult {
  nodeId: string;
  status: "success" | "failed" | "skipped";
  duration: number;
  output: any;
  error?: string;
  inputs?: any;
}

interface Run {
  id: string;
  createdAt: string;
  status: "success" | "failed" | "partial" | "running";
  scope: "full" | "partial" | "single";
  duration: number;
  nodeResults: NodeResult[];
}

interface HistoryPanelProps {
  runs: Run[];
  runCount?: number;
  isRunning?: boolean;
  runningNodes?: string[];
  runScope?: "full" | "partial" | "single";
  selectedNodeIds?: string[];
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "success") return <CheckCircle size={12} className="text-green-500" />;
  if (status === "failed") return <XCircle size={12} className="text-red-500" />;
  return <AlertCircle size={12} className="text-yellow-400" />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const cls =
    status === "success"
      ? "badge-success"
      : status === "failed"
      ? "badge-failed"
      : "badge-partial";
  return (
    <span className={`${cls} text-[10px] px-1.5 py-0.5 rounded-full capitalize`}>
      {status}
    </span>
  );
};

// Expandable output component
const OutputDisplay = ({ output, label = "→" }: { output: any; label?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const str = typeof output === "string" ? output : JSON.stringify(output, null, 2);
  if (!str) return null;
  const isLong = str.length > 200;
  
  return (
    <div className="mt-1">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-400 font-mono">{label}</span>
        {isLong && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="text-[9px] text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
          >
            {expanded ? <><EyeOff size={8} /> Less</> : <><Eye size={8} /> More</>}
          </button>
        )}
      </div>
      <p className={`text-[10px] text-gray-500 font-mono mt-0.5 ${expanded ? "whitespace-pre-wrap break-all" : "truncate"}`}
         style={expanded ? { maxHeight: 200, overflowY: "auto" } : {}}>
        {expanded ? str : (str.length > 200 ? str.slice(0, 200) + "..." : str)}
      </p>
    </div>
  );
};

export default function HistoryPanel({ runs, isRunning, runningNodes = [], runScope = "full", selectedNodeIds = [] }: HistoryPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nodes = useWorkflowStore((s) => s.nodes || []);

  // Only show nodes relevant to the current execution scope
  const getExecNodesSorted = () => {
    const executableNodes = nodes.filter((n) => n.type === "cropImage" || n.type === "geminiNode");
    
    // If running selective/single, only show targeted nodes
    if (runScope !== "full" && selectedNodeIds.length > 0) {
      return executableNodes.filter((n) => selectedNodeIds.includes(n.id));
    }
    
    return executableNodes;
  };

  // Live-ticking elapsed time while running
  useEffect(() => {
    if (isRunning) {
      setElapsedSec(0);
      timerRef.current = setInterval(() => {
        setElapsedSec((s) => s + 0.1);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSec(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Determine if we should show Request-Inputs and Response in running view
  const showRequestInputs = runScope === "full";
  const showResponse = runScope === "full";

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200" style={{ width: 280 }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
        <Clock size={14} className="text-gray-400" />
        <span className="text-[11px] font-bold text-gray-900 tracking-wider uppercase">Execution History</span>
        <span className="ml-auto text-[11px] text-gray-400">{runs.length} runs</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {runs.length === 0 && !isRunning ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
            <Clock size={24} className="text-gray-300" />
            <p className="text-sm text-gray-500">No runs yet</p>
            <p className="text-[11px] text-gray-400">Run your workflow to see history</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {isRunning && (
              <div className="p-4 bg-orange-50/50 border border-orange-200 m-3 rounded-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                <div className="flex items-start gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full border-[1.5px] border-orange-400 border-t-transparent animate-spin shrink-0 mt-0.5"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-900 font-bold">Run #{runs.length + 1}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Now</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] text-gray-600 font-medium">Duration: <span className="text-gray-900 font-bold">{elapsedSec.toFixed(1)}s</span></span>
                      <span className="ml-auto text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full uppercase">Running</span>
                    </div>
                    {runScope !== "full" && (
                      <span className="text-[10px] text-orange-600 mt-1 block capitalize">{runScope} execution</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 pt-3 border-t border-orange-100">
                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-3">Step Execution Details</p>
                  <div className="flex flex-col gap-2.5">
                    {showRequestInputs && (
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-700 font-medium">Request-Inputs</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">0.1s</span>
                          <CheckCircle size={14} className="text-green-500" />
                        </div>
                      </div>
                    )}
                    {getExecNodesSorted().map((node) => {
                      const status = node.data.status || "idle";
                      return (
                        <div key={node.id} className="flex items-center justify-between">
                          <span className="text-[12px] text-gray-700 font-medium truncate max-w-[150px]">
                            {node.data.label || node.id.replace(/-\d+$/, '').replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {status === "running" && (
                              <>
                                <span className="text-[11px] text-orange-500 font-medium animate-pulse">
                                  Running...
                                </span>
                                <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-orange-400 border-t-transparent animate-spin shrink-0"></div>
                              </>
                            )}
                            {status === "success" && (
                              <>
                                <span className="text-[11px] text-gray-400">
                                  {node.type === "cropImage" ? "30.0s" : "0.1s"}
                                </span>
                                <CheckCircle size={14} className="text-green-500 shrink-0" />
                              </>
                            )}
                            {status === "failed" && (
                              <>
                                <span className="text-[11px] text-red-500">Failed</span>
                                <XCircle size={14} className="text-red-500 shrink-0" />
                              </>
                            )}
                            {status === "idle" && (
                              <>
                                <span className="text-[11px] text-gray-400">Pending</span>
                                <div className="w-3 h-3 rounded-full border border-gray-300 bg-gray-100 shrink-0"></div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {showResponse && (
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-700 font-medium">Response</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">Pending</span>
                          <div className="w-3 h-3 rounded-full border border-gray-300 bg-gray-100 shrink-0"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {runs.map((run, idx) => (
              <div key={run.id}>
                <button
                  onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                  className="w-full flex items-start gap-2 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                >
                  <StatusIcon status={run.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[12px] text-gray-900 font-medium">
                        Run #{runs.length - idx}
                      </span>
                      <StatusBadge status={run.status} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {format(new Date(run.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 capitalize">{run.scope} run</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{formatDuration(run.duration)}</span>
                    </div>
                  </div>
                  {expanded === run.id ? (
                    <ChevronDown size={12} className="text-gray-400 mt-1 shrink-0" />
                  ) : (
                    <ChevronRight size={12} className="text-gray-400 mt-1 shrink-0" />
                  )}
                </button>

                {/* Expanded node-level details with full output */}
                {expanded === run.id && (
                  <div className="px-4 pb-3 flex flex-col gap-1.5 bg-gray-50">
                    {(run.nodeResults || []).map((nr) => (
                      <div key={nr.nodeId} className="flex flex-col gap-0.5 py-1.5 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={nr.status} />
                          <span className="text-[11px] text-gray-700 font-medium truncate flex-1">
                            {nr.nodeId}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatDuration(nr.duration)}
                          </span>
                        </div>
                        {nr.inputs && (
                          <OutputDisplay output={nr.inputs} label="← inputs" />
                        )}
                        {nr.output && (
                          <OutputDisplay output={nr.output} label="→ output" />
                        )}
                        {nr.error && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            ⚠ {nr.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
