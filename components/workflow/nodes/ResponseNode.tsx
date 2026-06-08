"use client";

import { Handle, Position, NodeProps } from "reactflow";

export default function ResponseNode({ data, selected }: NodeProps) {
  const results: { key: string; value: string | null }[] = data.results || [
    { key: "result", value: data.result ?? null }
  ];

  return (
    <div className={`workflow-node ${selected ? "selected" : ""}`} style={{ minWidth: 220 }}>
      {/* Header — matches Galaxy.ai Response node */}
      <div className="node-header">
        <span className="text-gray-400 text-sm">📄</span>
        <span className="node-title">Response</span>
        <span className="text-[10px] text-gray-400">ⓘ</span>
      </div>

      <div className="node-body">
        {/* Result input handle */}
        <div className="node-field relative">
          <div className="node-field-label">
            <Handle type="target" position={Position.Left} id="result" style={{ left: -17 }} className="handle-response" />
            <span className="dot dot-green ml-4" />
            <span className="text-[11px] text-gray-600 font-medium">result</span>
          </div>
        </div>

        {/* Connected source labels — like Galaxy.ai shows source node names */}
        {results.map((r) => (
          <div key={r.key} className="flex items-center justify-between py-1 border border-gray-200 rounded-md px-2 bg-gray-50">
            <span className="text-[11px] text-gray-500 truncate flex-1">{r.key}</span>
            <div className="flex gap-1">
              <button className="text-gray-300 hover:text-gray-500 text-[10px]">✏</button>
              <button className="text-gray-300 hover:text-red-400 text-[10px]">✕</button>
            </div>
          </div>
        ))}

        {/* Output display */}
        {data.result ? (
          <div className="mt-1 p-2 bg-green-50 rounded-md border border-green-200 text-[11px] text-green-800 max-h-28 overflow-y-auto leading-relaxed">
            {data.result}
          </div>
        ) : (
          <div className="text-[11px] text-gray-400 text-center py-2">No output yet</div>
        )}
      </div>
    </div>
  );
}
