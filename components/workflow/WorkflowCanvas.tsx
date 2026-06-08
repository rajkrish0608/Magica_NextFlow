"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Download, Play, Copy } from "lucide-react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  NodeTypes,
  EdgeTypes,
  Connection,
  Node,
  Edge,
  useReactFlow,
  getConnectedEdges,
} from "reactflow";
import "reactflow/dist/style.css";

import { useWorkflowStore } from "@/store/workflow-store";
import RequestInputsNode from "./nodes/RequestInputsNode";
import CropImageNode from "./nodes/CropImageNode";
import GeminiNode from "./nodes/GeminiNode";
import ResponseNode from "./nodes/ResponseNode";
import AnimatedEdge from "./edges/AnimatedEdge";
import NodePicker from "./NodePicker";
import HistoryPanel from "./HistoryPanel";
import NodeContextMenu from "./NodeContextMenu";

// Type map for safe connection validation
const HANDLE_TYPES: Record<string, string> = {
  text_field: "text", prompt: "text", response: "text",
  system_prompt: "text", result: "text",
  image_field: "image", input_image: "image", output_image: "image", vision: "image",
};

const nodeTypes: NodeTypes = {
  requestInputs: RequestInputsNode,
  cropImage: CropImageNode,
  geminiNode: GeminiNode,
  responseNode: ResponseNode,
};

const edgeTypes: EdgeTypes = {
  animatedEdge: AnimatedEdge,
};

interface WorkflowCanvasProps {
  workflowId: string;
  runs: any[];
  onSave: (nodes: Node[], edges: Edge[], viewport: any) => void;
  onRun: (scope: "full" | "partial" | "single", selectedNodeIds?: string[]) => void;
  isRunning: boolean;
  workflowName: string;
  onRename: (name: string) => void;
  onClone: () => void;
}

let nodeCounter = 100;

export default function WorkflowCanvas({
  workflowId, runs, onSave, onRun, isRunning, workflowName, onRename, onClone,
}: WorkflowCanvasProps) {
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect: storeOnConnect,
    addNode, updateNodeData, pushHistory, undo, redo, runningNodes
  } = useWorkflowStore();

  const { getViewport, fitView } = useReactFlow();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [runScope, setRunScope] = useState<"full" | "partial" | "single">("full");
  const [runSelectedIds, setRunSelectedIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; nodeId: string; nodeType: string;
  } | null>(null);

  // Auto-save
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onSave(nodes, edges, getViewport());
    }, 1500);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [nodes, edges]);

  // Undo/Redo keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z / Cmd+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Sync connectedInputs on each edge change
  useEffect(() => {
    for (const node of nodes) {
      if (node.type === "cropImage" || node.type === "geminiNode") {
        const incomingEdges = edges.filter((e) => e.target === node.id);
        const connectedInputs: Record<string, any> = {};
        for (const edge of incomingEdges) {
          const handle = edge.targetHandle ?? "";
          if (handle === "vision") {
            // vision accepts multiple — store as array
            if (!connectedInputs[handle]) connectedInputs[handle] = [];
            connectedInputs[handle].push(`${edge.source}__${edge.sourceHandle}`);
          } else {
            connectedInputs[handle] = `${edge.source}__${edge.sourceHandle}`;
          }
        }
        updateNodeData(node.id, { connectedInputs });
      }
    }
  }, [edges]);

  // Type-safe + cycle-free connection validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isValidConnection = useCallback(
    (connection: any) => {
      let srcType = "any";
      const srcHandle = connection.sourceHandle ?? "";
      if (srcHandle.startsWith("text_field") || srcHandle === "prompt" || srcHandle === "response" || srcHandle === "system_prompt" || srcHandle === "result") srcType = "text";
      else if (srcHandle.startsWith("image_field") || srcHandle === "input_image" || srcHandle === "output_image" || srcHandle === "vision") srcType = "image";
      else srcType = HANDLE_TYPES[srcHandle] ?? "any";

      let tgtType = "any";
      const tgtHandle = connection.targetHandle ?? "";
      if (tgtHandle.startsWith("text_field") || tgtHandle === "prompt" || tgtHandle === "response" || tgtHandle === "system_prompt" || tgtHandle === "result") tgtType = "text";
      else if (tgtHandle.startsWith("image_field") || tgtHandle === "input_image" || tgtHandle === "output_image" || tgtHandle === "vision") tgtType = "image";
      else tgtType = HANDLE_TYPES[tgtHandle] ?? "any";

      if (srcType !== "any" && tgtType !== "any" && srcType !== tgtType) return false;

      // Cycle detection
      const visited = new Set<string>();
      const queue = [connection.target!];
      while (queue.length) {
        const curr = queue.pop()!;
        if (curr === connection.source) return false;
        if (visited.has(curr)) continue;
        visited.add(curr);
        edges.filter((e) => e.source === curr).forEach((e) => queue.push(e.target));
      }
      return true;
    },
    [edges]
  );

  // Track selected nodes
  const onSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    setSelectedIds(sel.map((n) => n.id));
  }, []);

  // Right-click context menu on node
  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id, nodeType: node.type ?? "" });
  }, []);

  // Delete node (protected nodes cannot be deleted)
  const handleDeleteNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.type === "requestInputs" || node.type === "responseNode") return;
    pushHistory();
    onNodesChange([{ type: "remove", id: nodeId }]);
  }, [nodes, pushHistory, onNodesChange]);

  // Add node from picker
  const handleAddNode = useCallback((type: string) => {
    nodeCounter++;
    const viewport = getViewport();
    const cx = (-viewport.x + window.innerWidth / 2) / viewport.zoom;
    const cy = (-viewport.y + window.innerHeight / 2) / viewport.zoom;

    if (type === "cropImage") {
      addNode({
        id: `crop-image-${nodeCounter}`,
        type: "cropImage",
        position: { x: cx - 120, y: cy - 80 },
        data: {
          label: `Crop Image #${nodeCounter}`,
          inputs: { x: 0, y: 0, width: 100, height: 100 },
          connectedInputs: {},
          output: null,
          status: "idle",
        },
      });
    } else if (type === "geminiNode") {
      addNode({
        id: `gemini-${nodeCounter}`,
        type: "geminiNode",
        position: { x: cx - 130, y: cy - 100 },
        data: {
          label: `Gemini 3.1 Pro #${nodeCounter}`,
          model: "gemini-3.1-pro",
          systemPrompt: "",
          prompt: "",
          connectedInputs: {},
          output: null,
          status: "idle",
        },
      });
    }
  }, [addNode, getViewport]);

  // JSON import on canvas
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { nodes: importedNodes, edges: importedEdges } = JSON.parse(ev.target?.result as string);
        useWorkflowStore.setState({ nodes: importedNodes, edges: importedEdges, past: [], future: [] });
      } catch {
        alert("Invalid workflow JSON");
      }
    };
    reader.readAsText(file);
  }, []);

  // Apply pulsating glow to running nodes
  const nodesWithGlow = useMemo(
    () => nodes.map((n) => ({
      ...n,
      className: runningNodes.has(n.id) ? "node-running" : "",
      data: {
        ...n.data,
        isRunning: isRunning || runningNodes.has(n.id) || n.data?.status === "running",
        onRunSingle: () => {
          setRunScope("single");
          setRunSelectedIds([n.id]);
          onRun("single", [n.id]);
        },
      },
    })),
    [nodes, runningNodes, isRunning, onRun]
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
        <div className="flex-1 relative bg-[var(--bg-canvas)]">
        <ReactFlow
          nodes={nodesWithGlow}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={storeOnConnect}
          isValidConnection={isValidConnection}
          onSelectionChange={onSelectionChange}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={() => setContextMenu(null)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "animatedEdge", animated: true }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={["Delete", "Backspace"]}
          onNodeDragStart={() => pushHistory()}
          onNodesDelete={() => pushHistory()}
          onEdgesDelete={() => pushHistory()}
          multiSelectionKeyCode="Shift"
          selectionKeyCode="Shift"
          panOnDrag
          zoomOnScroll
          snapToGrid
          snapGrid={[16, 16]}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#d1d5db" />
          <MiniMap 
            position="bottom-right" 
            pannable 
            zoomable 
            className="!bg-[#1a1a1a] !border-none !rounded-xl !shadow-2xl overflow-hidden"
            nodeColor={(node) => {
              if (node.type === "geminiNode") return "#8b5cf6"; // purple
              if (node.type === "requestInputsNode") return "#ffffff"; // white
              if (node.type === "responseNode") return "#ffffff"; // white
              return "#3f3f46"; // zinc-700
            }}
            maskColor="rgba(0, 0, 0, 0.5)"
            style={{ bottom: 80, right: 16, width: 200, height: 130 }} 
          />
          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>

        {/* Node context menu */}
        {contextMenu && (
          <NodeContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            nodeId={contextMenu.nodeId}
            nodeType={contextMenu.nodeType}
            onDelete={handleDeleteNode}
            onRunSingle={(nid) => {
              setRunScope("single");
              setRunSelectedIds([nid]);
              onRun("single", [nid]);
            }}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* ── Bottom-center floating toolbar — + Add Block + Selective Run ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2" style={{ zIndex: 10 }}>
          <NodePicker onAddNode={handleAddNode} />
          {selectedIds.length > 0 && !isRunning && (
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1.5 shadow-md">
              <button
                onClick={() => {
                  const scope = selectedIds.length === 1 ? "single" : "partial";
                  setRunScope(scope);
                  setRunSelectedIds([...selectedIds]);
                  onRun(scope, selectedIds);
                }}
                className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors"
              >
                ▶ Run {selectedIds.length === 1 ? "Node" : `${selectedIds.length} Nodes`}
              </button>
            </div>
          )}
        </div>

        {/* ── Top header — workflow name + tabs ── */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200" style={{ zIndex: 10 }}>
          <div className="flex items-center gap-3 px-5 py-3">
            <a href="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </a>
            <input
              value={workflowName}
              onChange={(e) => onRename(e.target.value)}
              className="bg-transparent text-[16px] text-gray-900 font-semibold outline-none border-none"
              style={{ minWidth: 180 }}
            />
          </div>
        </div>

        {/* ── Toolbar strip — Workflow Structure + Import/Export/Run/Clone ── */}
        <div className="absolute top-[57px] left-0 right-0 bg-white border-b border-gray-200" style={{ zIndex: 10 }}>
          <div className="flex items-center justify-between px-5 py-2.5">
            <h2 className="text-[14px] font-semibold text-gray-900">Workflow Structure</h2>
            <div className="flex items-center gap-4">
            {isRunning && (
              <div className="flex items-center bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 shadow-sm">
                <span className="text-[13px] font-bold text-orange-600 mr-4">Viewing Execution #86f4 (RUNNING)</span>
                <div className="w-px h-4 bg-orange-200 mr-4"></div>
                <button className="text-[12px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-wider">
                  GO BACK TO EDITING
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* Import JSON */}
              <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload size={13} />Import JSON
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              {/* Export JSON */}
              <button
                onClick={() => {
                  const json = JSON.stringify({ nodes, edges }, null, 2);
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
                  a.download = `${workflowName}.json`;
                  a.click();
                }}
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={13} />Export JSON
              </button>
              {/* Run Flow */}
              <button
                onClick={() => {
                  setRunScope("full");
                  setRunSelectedIds([]);
                  onRun("full");
                }}
                disabled={isRunning}
                className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Play size={13} fill="white" />
                {isRunning ? "Running..." : "Run Flow"}
              </button>
              {/* Clone Workflow */}
              <button
                onClick={onClone}
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy size={13} />Clone Workflow
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* ── Bottom-left: Undo/Redo/Fit ── */}
        <div className="absolute bottom-6 left-4 flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm" style={{ zIndex: 10 }}>
          <button onClick={undo} title="Undo (Ctrl+Z)" className="text-gray-500 hover:text-gray-900 px-2 py-0.5 text-[13px] hover:bg-gray-100 rounded transition-colors">↩</button>
          <button onClick={redo} title="Redo" className="text-gray-500 hover:text-gray-900 px-2 py-0.5 text-[13px] hover:bg-gray-100 rounded transition-colors">↪</button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button onClick={() => fitView({ padding: 0.2 })} title="Fit view" className="text-gray-500 hover:text-gray-900 px-2 py-0.5 text-[13px] hover:bg-gray-100 rounded transition-colors">⊡</button>
        </div>
      </div>

      {/* ── Right sidebar — History ── */}
      <HistoryPanel 
        runs={runs} 
        isRunning={isRunning} 
        runningNodes={Array.from(runningNodes)}
        runScope={runScope}
        selectedNodeIds={runSelectedIds}
      />
    </div>
  );
}
