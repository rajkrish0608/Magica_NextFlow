import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SAMPLE_NODES, SAMPLE_EDGES, SAMPLE_WORKFLOW_NAME } from "@/lib/sample-workflow";

// Called after first login to seed sample workflow
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if user already has the sample workflow
  const existing = await prisma.workflow.findFirst({
    where: { userId, name: SAMPLE_WORKFLOW_NAME },
  });

  if (existing) {
    const nodes = existing.nodes as any[];
    if (!nodes || nodes.length < 7) {
      const updated = await prisma.workflow.update({
        where: { id: existing.id },
        data: {
          nodes: SAMPLE_NODES as any,
          edges: SAMPLE_EDGES as any,
        },
      });
      return NextResponse.json({ workflow: updated, seeded: true });
    }
    return NextResponse.json({ workflow: existing, seeded: false });
  }

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: SAMPLE_WORKFLOW_NAME,
      nodes: SAMPLE_NODES as any,
      edges: SAMPLE_EDGES as any,
    },
  });

  return NextResponse.json({ workflow, seeded: true }, { status: 201 });
}
