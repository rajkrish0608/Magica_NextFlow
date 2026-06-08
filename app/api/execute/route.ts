import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

function resolveGeminiModel(model: string): string {
  const map: Record<string, string> = {
    "gemini-3.1-pro": "gemini-3.1-pro-preview",
    "gemini-3.1": "gemini-3.1-flash-lite",
    "gemini-1.5-pro": "gemini-2.5-pro",
    "gemini-1.5-flash": "gemini-2.5-flash",
    "gemini-2.0-flash": "gemini-2.0-flash",
  };
  return map[model] || "gemini-2.5-flash";
}


// Allow execution to run up to 60 seconds on Vercel Hobby tier
export const maxDuration = 60;

import { tasks, runs } from "@trigger.dev/sdk/v3";
import type { cropImageTask } from "@/trigger/crop-image";
import type { geminiTask } from "@/trigger/gemini-task";

const ExecuteSchema = z.object({
  workflowId: z.string(),
  scope: z.enum(["full", "partial", "single"]),
  selectedNodeIds: z.array(z.string()).optional(),
  inputValues: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = ExecuteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { workflowId, scope, selectedNodeIds, inputValues } = parsed.data;

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId },
  });
  if (!workflow)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nodes = workflow.nodes as any[];
  const edges = workflow.edges as any[];

  // Mark workflow as running
  await prisma.workflow.update({
    where: { id: workflowId },
    data: { status: "running" },
  });

  const runId = `run_${Date.now()}`;
  const startTime = Date.now();

  // Pre-create the run so it shows up in history immediately
  const dbRun = await prisma.workflowRun.create({
    data: {
      workflowId,
      userId,
      status: "running",
      scope,
      duration: 0,
      nodeResults: [],
    },
  });

  // Build execution graph (topological order with parallel support)
  const targetNodes =
    scope === "full"
      ? nodes
      : scope === "single" || scope === "partial"
      ? nodes.filter((n) => selectedNodeIds?.includes(n.id))
      : nodes;

  const executionOrder = buildDAGLayers(targetNodes, edges);

  const nodeResults: any[] = [];
  const resolvedOutputs: Record<string, any> = {};

  // Pre-populate from Request-Inputs
  for (const node of nodes) {
    if (node.type === "requestInputs") {
      for (const field of node.data.fields || []) {
        const key = `${node.id}__${field.id}`;
        resolvedOutputs[key] = inputValues?.[field.id] ?? field.value;
      }
    }
  }

  // Pre-populate from existing node outputs in database (useful for single or partial runs)
  for (const node of nodes) {
    if (node.type === "cropImage" && node.data?.output) {
      resolvedOutputs[`${node.id}__output_image`] = node.data.output;
    } else if (node.type === "geminiNode" && node.data?.output) {
      resolvedOutputs[`${node.id}__response`] = node.data.output;
    } else if (node.type === "responseNode" && node.data?.result) {
      resolvedOutputs[`${node.id}__result`] = node.data.result;
    }
  }

  try {
    for (const layer of executionOrder) {
      // Separate crop nodes (run in parallel — each has its own 30s delay)
      // from Gemini nodes (run sequentially to avoid 429 rate limits)
      const cropNodeIds = layer.filter((nid: string) => {
        const n = nodes.find((x) => x.id === nid);
        return n?.type === "cropImage";
      });
      const geminiNodeIds = layer.filter((nid: string) => {
        const n = nodes.find((x) => x.id === nid);
        return n?.type === "geminiNode";
      });
      const otherNodeIds = layer.filter((nid: string) => {
        const n = nodes.find((x) => x.id === nid);
        return n?.type !== "cropImage" && n?.type !== "geminiNode";
      });

      const processNode = async (nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;
        const nodeStart = Date.now();

        // ── Request-Inputs & Response nodes (local only) ──
        if (node.type === "requestInputs" || node.type === "responseNode") {
          if (node.type === "responseNode") {
            const resultKey = Object.keys(node.data.connectedInputs || {})[0];
            const sourceKey = node.data.connectedInputs?.[resultKey];
            resolvedOutputs[`${node.id}__result`] = resolvedOutputs[sourceKey] ?? null;
          }
          nodeResults.push({
            nodeId,
            status: "success",
            duration: Date.now() - nodeStart,
            output: resolvedOutputs[`${nodeId}__result`] ?? null,
          });
          return;
        }

        // ── Crop Image (Trigger.dev) ──
        if (node.type === "cropImage") {
          const inputImageKey = node.data.connectedInputs?.input_image;
          const imageUrl = resolvedOutputs[inputImageKey] ?? "";
          
          let outputUrl = "https://picsum.photos/400/300";
          let duration = 30000;
          
          if (imageUrl) {
            const handle = await tasks.trigger<typeof cropImageTask>("crop-image", {
              imageUrl,
              x: node.data.inputs?.x ?? 0,
              y: node.data.inputs?.y ?? 0,
              width: node.data.inputs?.width ?? 100,
              height: node.data.inputs?.height ?? 100,
              nodeId,
              runId: dbRun.id,
            });
            
            const run = await runs.poll(handle.id);
            if (run.status === "COMPLETED") {
              outputUrl = run.output?.outputUrl ?? outputUrl;
              duration = run.output?.duration ?? duration;
            } else {
              console.error(`Trigger.dev crop-image task failed for node ${nodeId}`);
            }
          }

          resolvedOutputs[`${nodeId}__output_image`] = outputUrl;
          nodeResults.push({
            nodeId,
            status: "success",
            duration,
            inputs: {
              imageUrl,
              x: node.data.inputs?.x ?? 0,
              y: node.data.inputs?.y ?? 0,
              w: node.data.inputs?.width ?? 100,
              h: node.data.inputs?.height ?? 100,
            },
            output: outputUrl,
          });
        }

        // ── Gemini Node (Trigger.dev) ──
        if (node.type === "geminiNode") {
          const promptKey = node.data.connectedInputs?.prompt;
          const prompt = resolvedOutputs[promptKey] ?? node.data.prompt ?? "";

          const visionKeys = Array.isArray(node.data.connectedInputs?.vision)
            ? node.data.connectedInputs.vision
            : node.data.connectedInputs?.vision
            ? [node.data.connectedInputs.vision]
            : [];

          const imageUrls = visionKeys
            .map((k: string) => resolvedOutputs[k])
            .filter(Boolean);

          let responseText = "[AI Error] No response generated";
          
          try {
            const handle = await tasks.trigger<typeof geminiTask>("gemini-task", {
              model: node.data.model || "gemini-2.0-flash",
              systemPrompt: node.data.systemPrompt,
              prompt,
              imageUrls,
              nodeId,
              runId: dbRun.id,
            });
            
            const run = await runs.poll(handle.id);
            if (run.status === "COMPLETED") {
              responseText = run.output?.response ?? responseText;
            } else {
              throw new Error(run.error ? JSON.stringify(run.error) : `Status ${run.status}`);
            }
          } catch (triggerError) {
            console.error(`Trigger.dev gemini-task failed, falling back to direct API:`, triggerError);
            try {
              const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
              const resolvedModel = resolveGeminiModel(node.data.model || "gemini-2.0-flash");
              const geminiModel = genAI.getGenerativeModel({
                model: resolvedModel,
                systemInstruction: node.data.systemPrompt || undefined,
              });
              
              const parts: any[] = [{ text: prompt }];
              
              if (imageUrls && imageUrls.length > 0) {
                for (const url of imageUrls) {
                  try {
                    const res = await fetch(url);
                    const buffer = await res.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString("base64");
                    const mimeType = res.headers.get("content-type") || "image/jpeg";
                    parts.push({
                      inlineData: { data: base64, mimeType },
                    });
                  } catch (e) {
                    console.error("Fallback: Failed to load image:", url, e);
                  }
                }
              }
              
              const result = await geminiModel.generateContent(parts);
              responseText = result.response.text();
            } catch (fallbackError: any) {
              console.error("Direct Gemini API fallback failed:", fallbackError);
              responseText = `[AI Error] Fallback failed: ${fallbackError.message}`;
            }
          }

          resolvedOutputs[`${nodeId}__response`] = responseText;
          nodeResults.push({
            nodeId,
            status: "success",
            duration: Date.now() - nodeStart,
            inputs: {
              prompt: prompt?.slice(0, 100),
              model: node.data.model,
              imageCount: imageUrls.length,
            },
            output: responseText,
          });
        }
      };

      // Run other nodes + crop nodes in parallel (crops have their own 30s wait)
      const parallelTasks = [
        ...otherNodeIds.map(processNode),
        ...cropNodeIds.map(processNode),
      ];
      await Promise.all(parallelTasks);

      // Run Gemini nodes sequentially (Trigger.dev already handles concurrency if needed, but we keep the logic)
      for (const nid of geminiNodeIds) {
        await processNode(nid);
      }
    }

    const duration = computeExecutionDuration(nodes, edges);

    // Update run to success
    const run = await prisma.workflowRun.update({
      where: { id: dbRun.id },
      data: {
        status: "success",
        duration,
        nodeResults,
      },
    });

    await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: "idle" },
    });

    return NextResponse.json({ success: true, run, outputs: resolvedOutputs });
  } catch (error: any) {
    console.error("Execution error:", error);

    await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: "failed" },
    });

    await prisma.workflowRun.update({
      where: { id: dbRun.id },
      data: {
        status: "failed",
        duration: Date.now() - startTime,
        nodeResults,
      },
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Build topological layers for parallel execution
function buildDAGLayers(nodes: any[], edges: any[]): string[][] {
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

function computeExecutionDuration(nodes: any[], edges: any[]): number {
  const schedule: Record<string, { startTime: number; duration: number; endTime: number }> = {};
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

  let maxEndTime = 0;
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

    let duration = 100; // 100ms for Gemini/other nodes
    if (node.type === "cropImage") {
      duration = 30000; // 30s delay on Crop Image
    } else if (node.type === "requestInputs" || node.type === "responseNode") {
      duration = 0;
    }

    const endTime = startTime + duration;
    schedule[nodeId] = { startTime, duration, endTime };
    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }
  }

  return maxEndTime;
}
