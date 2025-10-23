/**
 * Flow Builder - Converts story tree structure to React Flow nodes and edges.
 *
 * This is a core utility that transforms domain-specific data (StoryNode + TreeStructure)
 * into the format expected by React Flow for visualization.
 *
 * @module utils/flow-builder
 */

import type { StoryNode, TreeStructure } from '../types/story';
import type { FlowNode, FlowEdge } from '../types/visualization';

/**
 * Result of building flow structure.
 */
export interface FlowStructure {
  /** Array of React Flow nodes with positioned story data */
  nodes: FlowNode[];

  /** Array of React Flow edges representing parent-child relationships */
  edges: FlowEdge[];
}

/**
 * Converts a story tree structure into React Flow nodes and edges.
 *
 * This function performs several important tasks:
 * 1. Validates that all referenced nodes exist (fail fast on bad data)
 * 2. Creates FlowNode objects wrapping each StoryNode
 * 3. Enriches nodes with computed properties (isLeaf)
 * 4. Generates edges for each parent-child relationship
 * 5. Uses decisionText from child nodes as edge labels
 *
 * **Teaching Note**: In library code, we validate inputs thoroughly because
 * consumers might pass unexpected data. Application code can be more lenient.
 *
 * @param nodes - Map of node ID to story node data
 * @param structure - Tree structure mapping node IDs to their children
 * @param rootId - ID of the root node to start traversal
 * @returns Flow structure with nodes and edges
 * @throws {Error} If inputs are invalid or tree structure is malformed
 *
 * @example
 * ```typescript
 * const nodes = new Map([
 *   ['start', { id: 'start', title: 'Begin', content: '...' }],
 *   ['end', { id: 'end', title: 'End', content: '...', decisionText: 'Finish' }]
 * ]);
 *
 * const structure = {
 *   'start': ['end'],
 *   'end': []
 * };
 *
 * const flow = buildFlowStructure(nodes, structure, 'start');
 * // flow.nodes.length === 2
 * // flow.edges[0].data.label === 'Finish'
 * ```
 */
export function buildFlowStructure(
  nodes: Map<string, StoryNode>,
  structure: TreeStructure,
  rootId: string
): FlowStructure {
  // ===== Input Validation =====
  // Library code must validate inputs thoroughly to provide helpful error messages

  if (nodes.size === 0) {
    throw new Error('Nodes map is empty');
  }

  if (!nodes.has(rootId)) {
    throw new Error(`Root node "${rootId}" not found in nodes map`);
  }

  if (!structure[rootId]) {
    throw new Error(`Node "${rootId}" not found in tree structure`);
  }

  // ===== Traverse and Build =====
  // We'll use a queue-based breadth-first traversal to visit all nodes
  // and build the flow structure

  const flowNodes: FlowNode[] = [];
  const flowEdges: FlowEdge[] = [];
  const visited = new Set<string>(); // Track visited nodes to avoid duplicates
  const queue: string[] = [rootId]; // BFS queue

  while (queue.length > 0) {
    const currentId = queue.shift()!; // Get next node to process

    // Skip if already processed (handles convergent paths)
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    // Get the story node data
    const storyNode = nodes.get(currentId);
    if (!storyNode) {
      throw new Error(`Node "${currentId}" referenced in structure but not found in nodes map`);
    }

    // Get children from structure
    const childIds = structure[currentId];
    if (!childIds) {
      throw new Error(`Node "${currentId}" not found in tree structure`);
    }

    // Determine if this is a leaf node (no children)
    const isLeaf = childIds.length === 0;

    // Create the FlowNode
    // **Teaching Note**: FlowNode requires 'id', 'type', 'position', and 'data'
    // We'll set a default position here; the layout engine will compute real positions later
    const flowNode: FlowNode = {
      id: currentId,
      type: 'custom', // We'll use a custom node renderer component
      position: { x: 0, y: 0 }, // Placeholder - layout engine will position this
      data: {
        storyNode,
        isLeaf,
      },
    };

    flowNodes.push(flowNode);

    // Create edges for each child
    for (const childId of childIds) {
      // Validate child exists
      if (!nodes.has(childId)) {
        throw new Error(
          `Node "${childId}" referenced in structure but not found in nodes map`
        );
      }

      // Get child's decisionText to use as edge label
      const childNode = nodes.get(childId)!;
      const label = childNode.decisionText;

      // Create the edge
      // **Teaching Note**: Edge IDs should be unique and deterministic
      // We use "edge-{source}-{target}" format
      const edge: FlowEdge = {
        id: `edge-${currentId}-${childId}`,
        source: currentId,
        target: childId,
        type: 'smoothstep', // Curved edges look better for trees
        data: {
          label, // Will be undefined if decisionText not set (which is fine)
        },
      };

      flowEdges.push(edge);

      // Add child to queue for processing
      queue.push(childId);
    }
  }

  return {
    nodes: flowNodes,
    edges: flowEdges,
  };
}
