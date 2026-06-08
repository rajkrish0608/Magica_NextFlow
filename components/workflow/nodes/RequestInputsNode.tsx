"use client";

import { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Plus, Trash2, GripVertical, Loader2, ImageIcon, Type, ChevronDown } from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";
import { useTransloaditUpload } from "@/lib/use-transloadit-upload";

interface Field {
  id: string;
  type: "text_field" | "image_field";
  name: string;
  value: string | null;
}

export default function RequestInputsNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const { upload } = useTransloaditUpload();
  const [uploading, setUploading] = useState<Record<string, number | null>>({});
  const [showAddMenu, setShowAddMenu] = useState(false);
  const fields: Field[] = data.fields || [];

  const addField = (type: "text_field" | "image_field") => {
    const count = fields.filter((f) => f.type === type).length;
    const suffix = count > 0 ? `_${count + 1}` : "";
    const newField: Field = { id: `${type}${suffix}`, type, name: `${type}${suffix}`, value: null };
    updateNodeData(id, { fields: [...fields, newField] });
    setShowAddMenu(false);
  };

  const removeField = (fieldId: string) => {
    updateNodeData(id, { fields: fields.filter((f) => f.id !== fieldId) });
  };

  const renameField = (fieldId: string, name: string) => {
    updateNodeData(id, { fields: fields.map((f) => (f.id === fieldId ? { ...f, name } : f)) });
  };

  const setValue = (fieldId: string, value: string | null) => {
    updateNodeData(id, { fields: fields.map((f) => (f.id === fieldId ? { ...f, value } : f)) });
  };

  const handleImageUpload = async (fieldId: string, file: File) => {
    setUploading((p) => ({ ...p, [fieldId]: 0 }));
    try {
      const result = await upload(file, (pct) => setUploading((p) => ({ ...p, [fieldId]: pct })));
      setValue(fieldId, result.url);
    } catch {
      setValue(fieldId, URL.createObjectURL(file));
    } finally {
      setUploading((p) => ({ ...p, [fieldId]: null }));
    }
  };

  return (
    <div className={`workflow-node ${selected ? "selected" : ""} ${data.status === "running" ? "node-running" : ""}`} style={{ minWidth: 256 }}>
      {/* Header — "Request-Inputs" label + ⓘ + + button with dropdown */}
      <div className="node-header">
        <span className="node-title">Request-Inputs</span>
        <span className="text-[10px] text-gray-400">ⓘ</span>
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }} className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <Plus size={12} />
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-6 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => addField("text_field")} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                <Type size={12} className="text-blue-500" />Text Field
              </button>
              <button onClick={() => addField("image_field")} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                <ImageIcon size={12} className="text-orange-500" />Image Field
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="node-body">
        {fields.map((field) => (
          <div key={field.id} className="node-field relative">
            {/* Label row with colored dot */}
            <div className="node-field-label">
              <span className={`dot ${field.type === "image_field" ? "dot-orange" : "dot-blue"}`} />
              <input
                value={field.name}
                onChange={(e) => renameField(field.id, e.target.value)}
                className="flex-1 bg-transparent border-none p-0 text-[11px] text-gray-600 font-medium outline-none min-w-0"
                style={{ fontSize: 11 }}
              />
              {/* Type label */}
              <span className="text-[10px] text-gray-400 mr-1">{field.type === "text_field" ? "Text" : "Image"}</span>
              {/* Copy + Delete icons */}
              <button onClick={() => removeField(field.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={10} />
              </button>
            </div>

            {/* Input */}
            {field.type === "text_field" ? (
              <div className="relative">
                <textarea
                  value={field.value ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  placeholder="Enter text..."
                  rows={2}
                  className="w-full resize-none text-[12px]"
                  style={{ fontSize: 12 }}
                />
                {/* Resize icon bottom-right like Galaxy.ai */}
                <span className="absolute bottom-1.5 right-1.5 text-gray-300 text-[10px] cursor-se-resize select-none">⤡</span>
              </div>
            ) : (
              <div>
                <label className="block cursor-pointer">
                  <div className="flex items-center gap-2 border border-dashed border-gray-200 hover:border-gray-300 rounded-md px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                    {uploading[field.id] != null ? (
                      <><Loader2 size={11} className="animate-spin text-indigo-500" /><span className="text-[11px] text-gray-500">Uploading {uploading[field.id]}%</span></>
                    ) : (
                      <><span className="text-[11px] text-gray-400">⬆</span><span className="text-[11px] text-gray-500">{field.value ? "Change image" : "Upload image"}</span></>
                    )}
                  </div>
                  <input type="file" accept="image/jpg,image/jpeg,image/png,image/webp,image/gif" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(field.id, f); }} />
                </label>
                {field.value && (
                  <img src={field.value} alt="preview" className="mt-1.5 w-full h-16 object-cover rounded-md border border-gray-200" />
                )}
              </div>
            )}

            {/* Output handle — orange for image, blue for text */}
            <Handle
              type="source" position={Position.Right} id={field.id}
              style={{ right: -5, width: 10, height: 10 }}
              className={field.type === "image_field" ? "handle-image" : "handle-text"}
            />
          </div>
        ))}

        {fields.length === 0 && (
          <p className="text-[11px] text-gray-400 text-center py-2">Click + to add fields</p>
        )}
      </div>
    </div>
  );
}
