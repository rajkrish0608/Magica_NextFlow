import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SAMPLE_NODES, SAMPLE_EDGES, SAMPLE_WORKFLOW_NAME } from "@/lib/sample-workflow";
import { Webhook } from "svix";

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();

  let evt: any;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const userId = evt.data.id;

    // Seed sample workflow for new user
    await prisma.workflow.create({
      data: {
        userId,
        name: SAMPLE_WORKFLOW_NAME,
        nodes: SAMPLE_NODES as any,
        edges: SAMPLE_EDGES as any,
      },
    });
  }

  return NextResponse.json({ success: true });
}
