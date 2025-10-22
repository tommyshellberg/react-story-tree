/**
 * @file Tree traversal utilities for extracting story paths
 * @module utils/traversal
 */

import type { StoryNode, TreeStructure, StoryPath } from '../types';

/**
 * Traverses a story tree using depth-first search and extracts all possible paths
 * from root to leaf nodes.
 *
 * This function is the core of story analysis - it finds every unique way a user
 * could experience the narrative from start to finish.
 *
 * @param nodes - Map of node IDs to story node data
 * @param structure - Branching structure (node ID → child IDs)
 * @param rootId - The starting node ID to traverse from
 * @returns Array of all complete paths from root to leaves
 * @throws {Error} If root node or any child node is missing from nodes map
 *
 * @example
 * ```typescript
 * const nodes = new Map([
 *   ['node-1', { id: 'node-1', title: 'Start', content: '...' }],
 *   ['node-2', { id: 'node-2', title: 'End', content: '...' }],
 * ]);
 * const structure = { 'node-1': ['node-2'], 'node-2': [] };
 * const paths = traverseTree(nodes, structure, 'node-1');
 * // Returns: [{ nodeIds: ['node-1', 'node-2'], nodes: [...], decisions: [...] }]
 * ```
 */
export function traverseTree(
  nodes: Map<string, StoryNode>,
  structure: TreeStructure,
  rootId: string
): StoryPath[] {
  // Validate that root node exists
  if (!nodes.has(rootId)) {
    throw new Error(`Root node "${rootId}" not found in nodes map`);
  }

  // Array to collect all complete paths
  const allPaths: StoryPath[] = [];

  /**
   * Recursive helper function that performs depth-first search
   *
   * @param currentId - Current node we're visiting
   * @param currentPath - Path taken so far (array of node IDs)
   * @param currentNodes - Array of StoryNode objects in path
   * @param currentDecisions - Decision text for each transition
   * @param visitedInPath - Set of node IDs visited in current path (for cycle detection)
   */
  function dfs(
    currentId: string,
    currentPath: string[],
    currentNodes: StoryNode[],
    currentDecisions: string[],
    visitedInPath: Set<string>
  ): void {
    // Circular reference detection: Check if we've seen this node in current path
    if (visitedInPath.has(currentId)) {
      const cycleStart = currentPath.indexOf(currentId);
      const cyclePath = [...currentPath.slice(cycleStart), currentId];
      throw new Error(
        `Circular reference detected: ${cyclePath.join(' → ')}. ` +
          `Story trees must be acyclic (no loops).`
      );
    }

    // Add current node to the path
    const node = nodes.get(currentId);
    if (!node) {
      throw new Error(`Child node "${currentId}" not found in nodes map`);
    }

    const newPath = [...currentPath, currentId];
    const newNodes = [...currentNodes, node];

    // Add decision text (if this isn't the root node)
    const newDecisions =
      currentPath.length > 0 && node.decisionText
        ? [...currentDecisions, node.decisionText]
        : currentDecisions;

    // Mark this node as visited in current path
    const newVisitedInPath = new Set(visitedInPath);
    newVisitedInPath.add(currentId);

    // Get children from structure
    const children = structure[currentId] || [];

    // Base case: This is a leaf node (no children)
    if (children.length === 0) {
      allPaths.push({
        nodeIds: newPath,
        nodes: newNodes,
        decisions: newDecisions,
      });
      return;
    }

    // Recursive case: Visit each child
    for (const childId of children) {
      dfs(childId, newPath, newNodes, newDecisions, newVisitedInPath);
    }
  }

  // Start DFS from root with empty visited set
  dfs(rootId, [], [], [], new Set());

  return allPaths;
}

/**
 * Concatenates all nodes in a story path into a single narrative string.
 * Useful for LLM analysis or displaying the complete story flow.
 *
 * The output format is clean and LLM-friendly:
 * - Each node is formatted as: # Title\nContent
 * - Decisions are shown as: [Decision: choice text]
 * - Sections separated by double newlines
 *
 * @param path - The story path to concatenate
 * @returns A single string containing the full narrative
 *
 * @example
 * ```typescript
 * const path = {
 *   nodeIds: ['node-1', 'node-2'],
 *   nodes: [
 *     { id: 'node-1', title: 'Start', content: 'You begin...' },
 *     { id: 'node-2', title: 'End', content: 'The end.', decisionText: 'Continue' }
 *   ],
 *   decisions: ['Continue']
 * };
 * const narrative = concatenatePath(path);
 * // Returns:
 * // # Start
 * // You begin...
 * //
 * // [Decision: Continue]
 * //
 * // # End
 * // The end.
 * ```
 */
export function concatenatePath(path: StoryPath): string {
  const segments: string[] = [];

  for (let i = 0; i < path.nodes.length; i++) {
    const node = path.nodes[i];

    // Type guard: Ensure node exists (should always be true due to loop bounds)
    if (!node) {
      throw new Error(`Node at index ${i} is undefined in path`);
    }

    // Add node content (title + content)
    segments.push(`# ${node.title}\n${node.content}`);

    // Add decision text if there's a next node
    if (i < path.decisions.length && path.decisions[i]) {
      segments.push(`[Decision: ${path.decisions[i]}]`);
    }
  }

  // Join all segments with double newlines for readability
  return segments.join('\n\n').trim();
}
