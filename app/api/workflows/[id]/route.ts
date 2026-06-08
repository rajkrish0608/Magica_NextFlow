import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  viewport: z.any().optional(),
  status: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await prisma.workflow.findFirst({
    where: { id, userId },
    include: {
      runs: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ workflow });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.workflow.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.nodes !== undefined && { nodes: parsed.data.nodes }),
      ...(parsed.data.edges !== undefined && { edges: parsed.data.edges }),
      ...(parsed.data.viewport !== undefined && { viewport: parsed.data.viewport }),
      ...(parsed.data.status && { status: parsed.data.status }),
    },
  });

  return NextResponse.json({ workflow: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workflow.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
