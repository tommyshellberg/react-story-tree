/**
 * Layout Engine - Positions React Flow nodes using Dagre graph layout algorithm.
 *
 * @module utils/layout
 */

import dagre from 'dagre';
import type { FlowNode, FlowEdge, LayoutOptions } from '../types/visualization';

/**
 * Default node dimensions used for layout calculations.
 * These determine spacing and overlap avoidance.
 */
const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;

/**
 * Default layout configuration.
 */
const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  direction: 'TB',
  nodeSpacing: 80,
  rankSpacing: 120,
};

/**
 * Applies Dagre layout algorithm to position React Flow nodes.
 *
 * Creates a hierarchical layout where parent nodes appear before their children
 * according to the specified direction. Automatically handles spacing and overlap
 * avoidance.
 *
 * @param nodes - Array of React Flow nodes to position
 * @param edges - Array of React Flow edges defining parent-child relationships
 * @param options - Optional layout configuration
 * @returns New array of nodes with computed positions
 *
 * @example
 * ```typescript
 * const layoutedNodes = applyLayout(nodes, edges, {
 *   direction: 'LR',
 *   nodeSpacing: 100,
 *   rankSpacing: 150
 * });
 * ```
 */
export function applyLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  options?: LayoutOptions
): FlowNode[] {
  if (nodes.length === 0) {
    return [];
  }

  const opts: Required<LayoutOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Initialize Dagre graph with layout configuration
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSpacing,
    ranksep: opts.rankSpacing,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes with dimensions
  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // Add edges to define hierarchy
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // Compute layout
  dagre.layout(graph);

  // Convert Dagre positions (center-based) to React Flow positions (top-left corner)
  const layoutedNodes: FlowNode[] = nodes.map((node) => {
    const dagreNode = graph.node(node.id);
    const x = dagreNode.x - NODE_WIDTH / 2;
    const y = dagreNode.y - NODE_HEIGHT / 2;

    return {
      ...node,
      position: { x, y },
    };
  });

  return layoutedNodes;
}
