import { create } from "zustand";
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge } from "reactflow";

export type NodeStatus = "idle" | "running" | "success" | "failed";

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

interface WorkflowStore {
  workflowId: string | null;
  workflowName: string;
  nodes: Node[];
  edges: Edge[];
  past: HistoryEntry[];
  future: HistoryEntry[];
  selectedNodes: string[];
  isRunning: boolean;
  runningNodes: Set<string>;

  setWorkflow: (id: string, name: string, nodes: Node[], edges: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setRunningNodes: (nodeIds: string[]) => void;
  clearRunningNodes: () => void;
  setIsRunning: (v: boolean) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflowId: null,
  workflowName: "Untitled Workflow",
  nodes: [],
  edges: [],
  past: [],
  future: [],
  selectedNodes: [],
  isRunning: false,
  runningNodes: new Set(),

  setWorkflow: (id, name, nodes, edges) => {
    set({ workflowId: id, workflowName: name, nodes, edges, past: [], future: [] });
  },

  setWorkflowName: (name) => set({ workflowName: name }),

  onNodesChange: (changes) => {
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
  },

  onConnect: (connection) => {
    get().pushHistory();
    set((state) => ({
      edges: addEdge(
        { ...connection, type: "animatedEdge", animated: true },
        state.edges
      ),
    }));
  },

  addNode: (node) => {
    get().pushHistory();
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  },

  setNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
      ),
    }));
  },

  setRunningNodes: (nodeIds) => {
    set({ runningNodes: new Set(nodeIds) });
  },

  clearRunningNodes: () => {
    set({ runningNodes: new Set() });
  },

  setIsRunning: (v) => set({ isRunning: v }),

  pushHistory: () => {
    const { nodes, edges, past } = get();
    set({
      past: [...past.slice(-49), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
      future: [],
    });
  },

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      nodes: prev.nodes,
      edges: prev.edges,
      future: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...future.slice(0, 49)],
    });
  },

  redo: () => {
    const { past, nodes, edges, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      future: future.slice(1),
      nodes: next.nodes,
      edges: next.edges,
      past: [...past.slice(-49), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
    });
  },
}));
