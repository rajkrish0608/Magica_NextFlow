"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReactFlowProvider, Node, Edge } from "reactflow";
import { useWorkflowStore } from "@/store/workflow-store";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import LoadingScreen from "@/components/LoadingScreen";

function buildDAGLayers(nodes: Node[], edges: Edge[]): string[][] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};

  for (const node of nodes) {
    inDegree[node.id] = 0;
    adjacency[node.id] = [];
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  }

  const layers: string[][] = [];
  let current = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);

  while (current.length > 0) {
    layers.push(current);
    const next: string[] = [];
    for (const id of current) {
      for (const neighbor of adjacency[id] || []) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) next.push(neighbor);
      }
    }
    current = next;
  }

  return layers;
}



interface WorkflowData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  viewport?: any;
  runs: any[];
}

interface NodeSchedule {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
}

function computeSchedule(nodes: Node[], edges: Edge[]): Record<string, NodeSchedule> {
  const schedule: Record<string, NodeSchedule> = {};
  const parentsMap: Record<string, string[]> = {};
  for (const node of nodes) {
    parentsMap[node.id] = [];
  }
  for (const edge of edges) {
    if (parentsMap[edge.target]) {
      parentsMap[edge.target].push(edge.source);
    }
  }

  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};
  for (const node of nodes) {
    inDegree[node.id] = 0;
    adjacency[node.id] = [];
  }
  for (const edge of edges) {
    if (adjacency[edge.source]) {
      adjacency[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  }

  const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const sortedOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sortedOrder.push(id);
    for (const neighbor of adjacency[id] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  for (const nodeId of sortedOrder) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const parents = parentsMap[nodeId] || [];
    let startTime = 0;
    for (const parentId of parents) {
      if (schedule[parentId]) {
        startTime = Math.max(startTime, schedule[parentId].endTime);
      }
    }

    let duration = 100;
    if (node.type === "cropImage") {
      duration = 30000;
    } else if (node.type === "requestInputs" || node.type === "responseNode") {
      duration = 0;
    }

    schedule[nodeId] = {
      id: nodeId,
      startTime,
      duration,
      endTime: startTime + duration,
    };
  }

  return schedule;
}

export default function WorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setWorkflow, setWorkflowName, setIsRunning, setRunningNodes, clearRunningNodes, updateNodeData } =
    useWorkflowStore();

  const [workflow, setWorkflowState] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [isRunning, setIsRunningLocal] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Fetch workflow on mount
  useEffect(() => {
    console.log("[NextFlow] Candidate LinkedIn: https://www.linkedin.com/in/rajkrishbuilds/");
    const load = async () => {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      const wf = data.workflow;
      setWorkflowState(wf);
      setWorkflow(wf.id, wf.name, wf.nodes as Node[], wf.edges as Edge[]);
      setRuns(wf.runs || []);
      setLoading(false);
    };
    load();
  }, [id]);

  // Save handler
  const handleSave = useCallback(
    async (nodes: Node[], edges: Edge[], viewport: any) => {
      await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, viewport }),
      });
    },
    [id]
  );

  // Rename handler
  const handleRename = useCallback(
    async (name: string) => {
      setWorkflowName(name);
      await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    },
    [id, setWorkflowName]
  );

  // Clone handler — creates a duplicate workflow and navigates to it
  const handleClone = useCallback(async () => {
    try {
      const storeState = useWorkflowStore.getState();
      const cloneNodes = storeState.nodes.length > 0 ? storeState.nodes : (workflow as any)?.nodes || [];
      const cloneEdges = storeState.edges.length > 0 ? storeState.edges : (workflow as any)?.edges || [];
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${workflow?.name || "Untitled Workflow"} (Copy)`,
          nodes: cloneNodes,
          edges: cloneEdges,
        }),
      });
      const data = await res.json();
      if (data.workflow?.id) {
        router.push(`/workflow/${data.workflow.id}`);
      } else {
        console.error("Clone failed:", data);
        alert("Failed to clone workflow.");
      }
    } catch (err) {
      console.error("Clone error:", err);
      alert("Failed to clone workflow.");
    }
  }, [workflow, router]);

  // Run handler with client-side DAG execution simulation and API execution
  const handleRun = useCallback(
    async (scope: "full" | "partial" | "single", selectedNodeIds?: string[]) => {
      if (isRunning) return;

      // Clear any pending timeouts
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      setIsRunningLocal(true);
      setIsRunning(true);

      const storeState = useWorkflowStore.getState();
      const inputValues: Record<string, any> = {};
      for (const node of storeState.nodes) {
        if (node.type === "requestInputs") {
          for (const field of node.data.fields || []) {
            inputValues[field.id] = field.value;
          }
        }
      }

      // Reset node status to idle in store
      for (const node of storeState.nodes) {
        if (node.type !== "requestInputs" && node.type !== "responseNode") {
          updateNodeData(node.id, { status: "idle", output: null });
        } else if (node.type === "responseNode") {
          updateNodeData(node.id, { result: null });
        }
      }

      // Set executable target IDs
      const targetIds =
        scope === "full"
          ? storeState.nodes.map((n) => n.id)
          : selectedNodeIds || [];

      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId: id,
            scope,
            selectedNodeIds,
            inputValues,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Execution failed");
        }

        const outputs = data.outputs || {};
        
        // Immediately apply outputs to the nodes since the backend has already executed them.
        for (const node of storeState.nodes) {
          const isTarget =
            scope === "full" ||
            targetIds.includes(node.id) ||
            node.type === "requestInputs" ||
            node.type === "responseNode";

          if (!isTarget) continue;

          if (node.type === "cropImage") {
            const outputUrl = outputs[`${node.id}__output_image`];
            updateNodeData(node.id, { output: outputUrl || null, status: "success" });
          } else if (node.type === "geminiNode") {
            const response = outputs[`${node.id}__response`];
            updateNodeData(node.id, { output: response || null, status: "success" });
          } else if (node.type === "responseNode") {
            const result = outputs[`${node.id}__result`];
            updateNodeData(node.id, { result: result || null });
          }
        }

        clearRunningNodes();
        setIsRunningLocal(false);
        setIsRunning(false);

        // Save updated node outputs back to the database
        const finalState = useWorkflowStore.getState();
        try {
          await fetch(`/api/workflows/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodes: finalState.nodes, edges: finalState.edges }),
          });
        } catch {}



      } catch (err: any) {
        console.error("Run failed:", err);
        window.alert(`Execution Error: ${err.message}`);
        // Mark all unfinished target nodes as failed
        for (const nodeId of targetIds) {
          const node = storeState.nodes.find((n) => n.id === nodeId);
          if (node && node.type !== "requestInputs" && node.type !== "responseNode") {
            updateNodeData(nodeId, { status: "failed" });
          }
        }
        clearRunningNodes();
        setIsRunningLocal(false);
        setIsRunning(false);
      } finally {
        // ALWAYS refresh runs list, even if it failed
        const runRes = await fetch(`/api/workflows/${id}?t=${Date.now()}`, { cache: "no-store" });
        if (runRes.ok) {
          const runData = await runRes.json();
          setRuns(runData.workflow?.runs || []);
        }
      }
    },
    [id, isRunning, setIsRunning, setRunningNodes, clearRunningNodes, updateNodeData]
  );

  const [activeTab, setActiveTab] = useState<"playground" | "api" | "workflow">("workflow");

  if (loading) return <LoadingScreen />;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">{workflow?.name}</h1>
        </div>
        <div className="flex items-center gap-4">
           <button className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
           </button>
        </div>
      </header>

      <div className="flex items-center px-8 border-b border-gray-200 shrink-0">
        <button 
          onClick={() => setActiveTab("playground")}
          className={`px-6 py-3.5 text-[15px] font-semibold transition-colors border-b-2 ${activeTab === "playground" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Playground
        </button>
        <button 
          onClick={() => setActiveTab("api")}
          className={`px-6 py-3.5 text-[15px] font-semibold transition-colors border-b-2 ${activeTab === "api" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          API
        </button>
        <button 
          onClick={() => setActiveTab("workflow")}
          className={`px-6 py-3.5 text-[15px] font-semibold transition-colors border-b-2 ${activeTab === "workflow" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Workflow
        </button>
      </div>

      <div className="flex-1 relative bg-gray-50 overflow-auto">
        {activeTab === "workflow" && (
          <div className="absolute inset-0 flex">
            <div className="flex-1 relative">
               <ReactFlowProvider>
                 <WorkflowCanvas
                    workflowId={id}
                    runs={runs}
                    onSave={handleSave}
                    onRun={handleRun}
                    isRunning={isRunning}
                    workflowName={workflow?.name || "Untitled"}
                    onRename={handleRename}
                    onClone={handleClone}
                 />
               </ReactFlowProvider>
            </div>
          </div>
        )}

        {activeTab === "playground" && (
          <div className="absolute inset-0 p-8 flex gap-6 overflow-hidden">
             <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-[17px] font-bold text-gray-900">Inputs</h2>
                    <p className="text-[13px] text-gray-500 mt-1">Configure the input fields for this workflow run</p>
                  </div>
                  <span className="text-[12px] font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Est. ~1.72M</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                     <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
                        Car prompt
                     </label>
                     <span className="text-xs text-gray-400">Text</span>
                  </div>
                  <textarea 
                    className="w-full h-40 border border-gray-200 rounded-xl p-4 text-[13px] resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-300"
                    placeholder="Enter Car prompt..."
                  />
                </div>

                <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>
                   Run
                </button>
             </div>
             
             <div className="flex-[1.2] flex flex-col bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-[17px] font-bold text-gray-900">Output</h2>
                  <p className="text-[13px] text-gray-500 mt-1">Results from workflow execution</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M5 3l14 9-14 9V3z"/></svg>
                   </div>
                   <h3 className="text-sm font-bold text-gray-400 mb-1">No output yet</h3>
                   <p className="text-[13px] text-gray-400">Run the workflow to see results here</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="absolute inset-0 p-8 flex gap-8 overflow-hidden">
             <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <select className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-300 bg-white">
                    <option>Python</option>
                  </select>
                  <button className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy
                  </button>
                </div>
                <div className="flex-1 p-6 bg-gray-50 overflow-auto">
                   <pre className="text-[13px] leading-loose text-gray-800 font-mono">
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">1</span><span className="text-purple-600">import</span> requests{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">2</span><span className="text-purple-600">import</span> time{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">3</span><span className="text-purple-600">import</span> json{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">4</span>{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">5</span>api_key = <span className="text-green-600">"YOUR_API_KEY"</span>{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">6</span>url = <span className="text-green-600">"https://api.magica.com/api/v1/runs"</span>{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">7</span>{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">8</span>data = {'{\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">9</span>    <span className="text-green-600">"workflowId"</span>: <span className="text-green-600">"{id}"</span>,{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">10</span>    <span className="text-green-600">"values"</span>: {'{\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">11</span>        <span className="text-green-600">"node_1772800705319_request"</span>: {'{\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">12</span>            <span className="text-green-600">"Car prompt"</span>: <span className="text-green-600">"your text here"</span>{'\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">13</span>        {'}\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">14</span>    {'}\n'}
<span className="text-gray-400 select-none inline-block w-6 text-right mr-4">15</span>{'}\n'}
                   </pre>
                </div>
             </div>

             <div className="flex-1 flex flex-col overflow-auto pr-2">
                <h3 className="font-bold text-[15px] text-gray-900 mb-3">API Endpoint</h3>
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-4 mb-8">
                  <span className="bg-green-200 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="text-gray-800 text-[13px] font-medium font-mono">https://api.magica.com/api/v1/runs</code>
                </div>

                <h3 className="font-bold text-[15px] text-gray-900 mb-3">Response Format</h3>
                <div className="mb-8">
                  <p className="text-[13px] text-gray-600 mb-3">The start endpoint returns a <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[12px] font-mono">runId</code>.</p>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
<pre className="text-[13px] text-gray-800 font-mono">
{`{
  "runId": "run_abc123..."
}`}
</pre>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
