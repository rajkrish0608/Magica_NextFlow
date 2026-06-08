"use client";

import { useEffect, useRef } from "react";
import { Trash2, Play, Copy } from "lucide-react";

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeType: string;
  onDelete: (nodeId: string) => void;
  onRunSingle: (nodeId: string) => void;
  onClose: () => void;
}

export default function NodeContextMenu({
  x, y, nodeId, nodeType, onDelete, onRunSingle, onClose,
}: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isProtected = nodeType === "requestInputs" || nodeType === "responseNode";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 overflow-hidden min-w-[140px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => { onRunSingle(nodeId); onClose(); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-white"
      >
        <Play size={12} className="text-green-400" />
        Run this node
      </button>

      <div className="h-px bg-[#3f3f46] my-1" />

      <button
        onClick={() => {
          if (!isProtected) { onDelete(nodeId); onClose(); }
        }}
        disabled={isProtected}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors ${
          isProtected
            ? "text-gray-400 cursor-not-allowed"
            : "text-red-400 hover:bg-red-500/10"
        }`}
      >
        <Trash2 size={12} />
        {isProtected ? "Cannot delete" : "Delete node"}
      </button>
    </div>
  );
}
