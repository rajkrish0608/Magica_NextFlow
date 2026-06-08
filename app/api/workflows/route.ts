import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SAMPLE_NODES, SAMPLE_EDGES, SAMPLE_WORKFLOW_NAME } from "@/lib/sample-workflow";

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).default("Untitled Workflow"),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ workflows });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = CreateWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, nodes, edges } = parsed.data;

  // Pre-place Request-Inputs + Response when creating a blank workflow
  const defaultNodes = [
    {
      id: "request-inputs-1",
      type: "requestInputs",
      position: { x: 80, y: 200 },
      data: { label: "Request Inputs", fields: [] },
      deletable: false,
    },
    {
      id: "response-1",
      type: "responseNode",
      position: { x: 700, y: 200 },
      data: { label: "Response", result: null, connectedInputs: {} },
      deletable: false,
    },
  ];

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name,
      nodes: (nodes && nodes.length > 0) ? nodes : defaultNodes,
      edges: edges ?? [],
    },
  });

  return NextResponse.json({ workflow }, { status: 201 });
}
