"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { useWorkflowStore } from "@/store/workflow-store";

export default function CropImageNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const isConn = (f: string) => !!data.connectedInputs?.[f];

  const fields = [
    { key: "x",      label: "X Position (%)", def: 0   },
    { key: "y",      label: "Y Position (%)", def: 0   },
    { key: "width",  label: "Width (%)",       def: 100 },
    { key: "height", label: "Height (%)",      def: 100 },
  ];

  return (
    <div className={`workflow-node ${selected ? "selected" : ""} ${data.status === "running" ? "node-running" : ""}`} style={{ minWidth: 248 }}>
      {/* Header */}
      <div className="node-header">
        <span className="node-title">{data.label || "Crop Image"}</span>
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
        {/* Input Image */}
        <div className="node-field relative">
          <div className="node-field-label">
            <Handle type="target" position={Position.Left} id="input_image" style={{ left: -17 }} className="handle-image" />
            <span className="dot dot-orange ml-4" />
            <span className="text-[11px] text-gray-600 font-medium flex-1">Input Image</span>
            <span className="text-red-400 text-[10px] ml-0.5">* required</span>
            {!isConn("input_image") && (
              <label className="flex items-center gap-1 text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 border border-gray-200 rounded px-2 py-0.5 ml-1">
                <span>⬆</span> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) updateNodeData(id, { inputImage: URL.createObjectURL(f), inputImageName: f.name });
                }} />
              </label>
            )}
          </div>
          {isConn("input_image") && (
            <div className="text-[10px] text-gray-400 pl-4">← Connected</div>
          )}
          {!isConn("input_image") && data.inputImage && (
            <img src={data.inputImage} alt="input" className="w-full h-14 object-cover rounded-md border border-gray-200 mt-1 ml-4" />
          )}
          {!isConn("input_image") && !data.inputImage && (
            <div className="text-[10px] text-gray-400 pl-4">No image uploaded</div>
          )}
        </div>

        {/* Numeric inputs */}
        {fields.map(({ key, label, def }) => (
          <div key={key} className="node-field relative">
            <div className="node-field-label">
              <Handle type="target" position={Position.Left} id={key} style={{ left: -17 }} className="handle-blue" />
              <span className="dot dot-blue ml-4" />
              <span className="text-[11px] text-gray-600 flex-1">{label}</span>
            </div>
            <input
              type="number" min={0} max={100}
              value={data.inputs?.[key] ?? def}
              onChange={(e) => updateNodeData(id, { inputs: { ...data.inputs, [key]: Number(e.target.value) } })}
              disabled={isConn(key)}
              className="text-[12px]"
              style={{ fontSize: 12 }}
            />
          </div>
        ))}

        {/* Output Image */}
        <div className="node-field relative border-t border-gray-100 pt-2">
          <div className="node-field-label justify-end pr-1">
            <span className="text-[11px] text-gray-500">Output Image</span>
            <span className="dot dot-orange" />
            <Handle type="source" position={Position.Right} id="output_image" style={{ right: -17 }} className="handle-image" />
          </div>
          {data.output ? (
            <img src={data.output} alt="crop" className="w-full h-14 object-cover rounded-md border border-gray-200 mt-1" />
          ) : (
            <div className="text-[10px] text-gray-400 mt-1">No output yet</div>
          )}
        </div>
      </div>

      {/* Cost estimate footer — matches Galaxy.ai */}
      <div className="node-cost">~ 0.001M</div>
    </div>
  );
}
