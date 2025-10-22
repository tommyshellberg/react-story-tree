/**
 * Core types for representing branching narrative stories.
 * @module types/story
 */

/**
 * Represents a single node in a branching narrative tree.
 * This is the core data structure that library consumers provide.
 *
 * @example
 * ```typescript
 * const node: StoryNode = {
 *   id: 'node-abc-123',
 *   customId: 'story-1a',
 *   title: 'The Forest Path',
 *   content: 'You stand at a fork in the road. To your left, you hear rustling in the bushes...',
 *   decisionText: 'Take the left path',
 *   metadata: { difficulty: 'medium', hasAudio: true }
 * };
 * ```
 */
export interface StoryNode {
  /** Unique identifier for the node (typically a UUID or database ID) */
  id: string;

  /** Display title of this story segment */
  title: string;

  /** The narrative content for this node */
  content: string;

  /**
   * Optional human-readable identifier (e.g., 'story-1a', 'chapter-2-3').
   * Useful for hierarchical naming and easier referencing.
   */
  customId?: string;

  /**
   * Optional text shown on the edge/decision leading TO this node.
   * Represents the choice the user made to reach this story segment.
   */
  decisionText?: string;

  /**
   * Arbitrary metadata about the node.
   * Library consumers can add any custom properties here
   * (e.g., rewards, tags, requirements, audio URLs, images, etc.)
   */
  metadata?: Record<string, unknown>;
}

/**
 * Defines the branching structure of a story tree.
 * Maps each node ID to an array of possible next node IDs.
 *
 * @example
 * ```typescript
 * const structure: TreeStructure = {
 *   'node-1': ['node-1a', 'node-1b'],    // Node 1 branches to 1a or 1b
 *   'node-1a': ['node-2'],                // Node 1a leads to node 2
 *   'node-1b': ['node-2', 'node-3'],      // Node 1b can lead to 2 or 3
 *   'node-2': [],                         // Node 2 is a leaf (no children)
 *   'node-3': []                          // Node 3 is a leaf
 * };
 * ```
 */
export interface TreeStructure {
  [nodeId: string]: string[];
}

/**
 * Represents a complete path through the story tree from root to leaf.
 * Used for story analysis, traversal, and concatenation.
 *
 * @example
 * ```typescript
 * const path: StoryPath = {
 *   nodeIds: ['node-1', 'node-1a', 'node-2'],
 *   nodes: [node1, node1a, node2],
 *   decisions: ['Take the left path', 'Enter the cave']
 * };
 * ```
 */
export interface StoryPath {
  /** Array of node IDs in order from root to leaf */
  nodeIds: string[];

  /** Array of story nodes in order */
  nodes: StoryNode[];

  /**
   * Decision text for each transition.
   * Length is nodes.length - 1 (no decision for the first node)
   */
  decisions: string[];
}

/**
 * A validated story node with additional computed properties.
 * Used internally after validating user-provided nodes.
 */
export interface EnrichedStoryNode extends StoryNode {
  /** Whether this node is a leaf (has no children) */
  isLeaf: boolean;

  /** IDs of child nodes */
  children: string[];

  /** Depth level in the tree (0 = root) */
  level: number;
}
