"use client";

import { BaseEdge, EdgeProps, getBezierPath } from "reactflow";

// Purple edges — spec: "Animated purple edges"
const DEFAULT_EDGE_COLOR = "#8b5cf6"; // purple-500

function getEdgeColor(sourceHandle?: string | null): string {
  return DEFAULT_EDGE_COLOR;
}

export default function AnimatedEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, selected,
  ...rest
}: EdgeProps) {
  const sourceHandle = (rest as any).sourceHandle as string | undefined;
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const color = getEdgeColor(sourceHandle);

  return (
    <>
      {/* Glow */}
      <path d={edgePath} fill="none" stroke={color} strokeWidth={selected ? 8 : 5} strokeLinecap="round" opacity={0.12} />
      {/* Main animated edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 2,
          strokeDasharray: "6 4",
          animation: "dash-flow 0.5s linear infinite",
        }}
      />
    </>
  );
}
