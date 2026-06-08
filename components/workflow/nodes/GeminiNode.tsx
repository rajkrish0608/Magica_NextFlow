"use client";

import { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ChevronRight, Paperclip } from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";

const MODELS = [
  { value: "gemini-3.5-flash",     label: "Gemini 3.5 Flash" },
  { value: "gemini-3.1-pro",       label: "Gemini 3.1 Pro" },
  { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { value: "gemini-2.5-pro",       label: "Gemini 2.5 Pro" },
  { value: "gemini-2.5-flash",     label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.0-flash",     label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-pro",       label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash",     label: "Gemini 1.5 Flash" },
];

export default function GeminiNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const [showSettings, setShowSettings] = useState(false);
  const isConn = (f: string) => !!data.connectedInputs?.[f];

  return (
    <div className={`workflow-node ${selected ? "selected" : ""} ${data.status === "running" ? "node-running" : ""}`} style={{ minWidth: 272 }}>
      {/* Header — model selector + Run pill + ··· */}
      <div className="node-header">
        <select
          value={data.model || "gemini-3.1-pro"}
          onChange={(e) => updateNodeData(id, { model: e.target.value })}
          className="flex-1 bg-transparent border-none text-[12px] font-semibold text-gray-800 outline-none cursor-pointer min-w-0"
          style={{ padding: 0, fontSize: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <span className="text-[10px] text-gray-400">ⓘ</span>
        <span className="text-[10px] text-gray-400">↺</span>
        <button
          className="btn-node-run"
          disabled={data.status === "running" || data.isRunning}
          onClick={(e) => {
            e.stopPropagation();
            if (data.onRunSingle) data.onRunSingle();
          }}
        >
          {data.status === "running" || data.isRunning ? "···" : "▶ Run"}
        </button>
        <span className="text-gray-400 text-[13px] cursor-pointer">···</span>
      </div>

      <div className="node-body">
        {/* Prompt* */}
        <div className="node-field relative">
          <div className="node-field-label">
            <Handle type="target" position={Position.Left} id="prompt" style={{ left: -17 }} className="handle-text" />
            <span className="dot dot-blue ml-4" />
            <span className="text-[11px] text-gray-600 font-medium flex-1">Prompt</span>
            <span className="text-red-400 text-[10px]" aria-label="required">*</span>
            {/* required */}
            <span className="text-[10px] text-gray-400 ml-1">ⓘ</span>
          </div>
          <div className="relative">
            <textarea
              value={isConn("prompt") ? "" : (data.prompt ?? "")}
              onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
              disabled={isConn("prompt")}
              placeholder={isConn("prompt") ? "← Connected" : "Enter your prompt..."}
              rows={2}
              className="w-full resize-none text-[12px]"
              style={{ fontSize: 12 }}
            />
            <span className="absolute bottom-1.5 right-1.5 text-gray-300 text-[10px] cursor-se-resize">⤡</span>
          </div>
        </div>

        {/* System Prompt */}
        <div className="node-field relative">
          <div className="node-field-label">
            <Handle type="target" position={Position.Left} id="system_prompt" style={{ left: -17 }} className="handle-text" />
            <span className="dot dot-blue ml-4" />
            <span className="text-[11px] text-gray-600 flex-1">System Prompt</span>
            <span className="text-[10px] text-gray-400">ⓘ</span>
          </div>
          <textarea
            value={data.systemPrompt ?? ""}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
            disabled={isConn("system_prompt")}
            placeholder="Optional system prompt..."
            rows={2}
            className="w-full resize-none text-[12px]"
            style={{ fontSize: 12 }}
          />
        </div>

        {/* Image (Vision) */}
        <div className="node-field relative">
          <div className="node-field-label">
            <Handle type="target" position={Position.Left} id="vision" style={{ left: -17 }} className="handle-image" />
            <span className="dot dot-orange ml-4" />
            <span className="text-[11px] text-gray-600 flex-1">Image (Vision)</span>
            <label className="flex items-center gap-1 text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 border border-gray-200 rounded px-2 py-0.5">
              <span>⬆</span> Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) updateNodeData(id, { visionFile: URL.createObjectURL(f) });
              }} />
            </label>
          </div>
          <div className="text-[10px] text-gray-400 pl-4">⬆ Upload requirements</div>
        </div>

        {/* Video */}
        <div className="node-field relative">
          <div className="node-field-label">
            <Handle type="target" position={Position.Left} id="video" style={{ left: -17 }} className="handle-purple" />
            <span className="dot dot-purple ml-4" />
            <span className="text-[11px] text-gray-600 flex-1">Video</span>
          </div>
        </div>

        {/* Audio */}
        <div className="node-field relative">
          <div className="node-field-label">
            <Handle type="target" position={Position.Left} id="audio" style={{ left: -17 }} className="handle-audio" />
            <span className="dot" style={{ background: "#ec4899" }} />
            <span className="text-[11px] text-gray-600 ml-4 flex-1">Audio</span>
          </div>
        </div>

        {/* File */}
        <div className="node-field relative">
          <div className="node-field-label">
            <Handle type="target" position={Position.Left} id="file" style={{ left: -17 }} />
            <Paperclip size={9} className="text-gray-400 ml-4" />
            <span className="text-[11px] text-gray-600 flex-1 ml-1">File</span>
          </div>
        </div>

        {/* Settings (collapsed) — matches Galaxy.ai */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 pt-1 border-t border-gray-100 w-full"
        >
          <ChevronRight size={10} className={showSettings ? "rotate-90 transition-transform" : "transition-transform"} />
          Settings
        </button>

        {showSettings && (
          <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-500">Temperature</span>
              <input type="number" min={0} max={2} step={0.1} value={data.temperature ?? 1}
                onChange={(e) => updateNodeData(id, { temperature: Number(e.target.value) })}
                className="w-16 text-[11px] text-right" style={{ fontSize: 11 }} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-500">Max tokens</span>
              <input type="number" min={1} max={8192} value={data.maxTokens ?? 1024}
                onChange={(e) => updateNodeData(id, { maxTokens: Number(e.target.value) })}
                className="w-16 text-[11px] text-right" style={{ fontSize: 11 }} />
            </div>
          </div>
        )}

        {/* Response output */}
        <div className="node-field relative border-t border-gray-100 pt-2">
          <div className="node-field-label justify-between">
            <span className="text-[11px] text-gray-600 font-medium">Response</span>
            <Handle type="source" position={Position.Right} id="response" style={{ right: -17 }} className="handle-response" />
          </div>
          {data.output ? (
            <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-[11px] text-gray-700 max-h-24 overflow-y-auto leading-relaxed">
              {data.output}
            </div>
          ) : (
            <div className="text-[11px] text-gray-400 mt-1">No output yet</div>
          )}
        </div>
      </div>

      {/* Cost estimate */}
      <div className="node-cost">~ 0.0001M</div>
    </div>
  );
}
