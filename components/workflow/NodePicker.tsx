"use client";

import { useState } from "react";
import { Plus, Search, X, Scissors, Bot } from "lucide-react";

interface NodePickerProps {
  onAddNode: (type: string) => void;
}

const CATEGORIES: Record<string, { type: string; label: string; icon: any; color: string; desc: string }[]> = {
  Recent: [
    { type: "cropImage",  label: "Crop Image",     icon: Scissors, color: "#f97316", desc: "FFmpeg image crop" },
    { type: "geminiNode", label: "Gemini 3.1 Pro", icon: Bot,      color: "#6366f1", desc: "Google Gemini LLM" },
  ],
  Image: [
    { type: "cropImage",  label: "Crop Image",     icon: Scissors, color: "#f97316", desc: "FFmpeg image crop" },
  ],
  Video:  [],
  Audio:  [],
  Others: [],
};

export default function NodePicker({ onAddNode }: NodePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Recent");

  const nodes = search
    ? Object.values(CATEGORIES).flat().filter((n) =>
        n.label.toLowerCase().includes(search.toLowerCase())
      )
    : (CATEGORIES[tab] || []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Picker popup */}
      {open && (
        <div
          className="absolute bottom-14 left-1/2 -translate-x-1/2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ zIndex: 1000 }}
        >
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
            <Search size={12} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes..."
              className="flex-1 bg-transparent border-none text-[13px] text-gray-700 outline-none"
              style={{ padding: 0, fontSize: 13 }}
            />
            <button onClick={() => { setOpen(false); setSearch(""); }}>
              <X size={12} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Category tabs */}
          {!search && (
            <div className="flex border-b border-gray-100 px-1">
              {Object.keys(CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTab(cat)}
                  className={`flex-1 text-[11px] py-2 transition-colors ${
                    tab === cat
                      ? "text-gray-900 font-medium border-b-2 border-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Node list */}
          <div className="max-h-48 overflow-y-auto p-2 flex flex-col gap-1">
            {nodes.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-4">No nodes found</p>
            ) : (
              nodes.map((node) => (
                <button
                  key={node.type}
                  onClick={() => { onAddNode(node.type); setOpen(false); setSearch(""); }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <node.icon size={13} style={{ color: node.color }} />
                  </div>
                  <div>
                    <p className="text-[13px] text-gray-800 font-medium">{node.label}</p>
                    <p className="text-[11px] text-gray-400">{node.desc}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bottom floating + button — matches Galaxy.ai */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-700 text-white flex items-center justify-center shadow-lg transition-colors"
        title="Add node"
      >
        <Plus size={18} className={open ? "rotate-45 transition-transform" : "transition-transform"} />
      </button>
    </div>
  );
}
