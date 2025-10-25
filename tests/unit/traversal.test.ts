/**
 * @file Tests for tree traversal utilities
 * @description Test-driven development for extracting all paths from story trees
 */

import { describe, it, expect } from 'vitest';
import type { StoryNode, TreeStructure, StoryPath } from '../../src/types';

// We'll implement these functions in src/utils/traversal.ts
import {
  traverseTree,
  concatenatePath,
  buildPathFromNodes,
} from '../../src/utils/traversal';

describe('traverseTree', () => {
  /**
   * Test Case 1: Simple linear story (no branches)
   * Structure: A → B → C
   * Expected: One path [A, B, C]
   */
  it('should traverse a simple linear story with no branches', () => {
    // Arrange: Create test data
    const nodes = new Map<string, StoryNode>([
      [
        'node-a',
        {
          id: 'node-a',
          title: 'Start',
          content: 'The adventure begins.',
          decisionText: undefined,
        },
      ],
      [
        'node-b',
        {
          id: 'node-b',
          title: 'Middle',
          content: 'You continue forward.',
          decisionText: 'Go forward',
        },
      ],
      [
        'node-c',
        {
          id: 'node-c',
          title: 'End',
          content: 'The journey is complete.',
          decisionText: 'Finish',
        },
      ],
    ]);

    const structure: TreeStructure = {
      'node-a': ['node-b'], // A leads to B
      'node-b': ['node-c'], // B leads to C
      'node-c': [], // C is a leaf node
    };

    const rootId = 'node-a';

    // Act: Call the function we're testing
    const paths = traverseTree(nodes, structure, rootId);

    // Assert: Verify results
    expect(paths).toHaveLength(1); // Only one path
    expect(paths[0].nodeIds).toEqual(['node-a', 'node-b', 'node-c']);
    expect(paths[0].nodes).toHaveLength(3);
    expect(paths[0].nodes[0].id).toBe('node-a');
    expect(paths[0].nodes[1].id).toBe('node-b');
    expect(paths[0].nodes[2].id).toBe('node-c');
    expect(paths[0].decisions).toEqual(['Go forward', 'Finish']);
  });

  /**
   * Test Case 2: Branching story (choose-your-own-adventure)
   * Structure:
   *        A
   *       / \
   *      B   C
   *     /     \
   *    D       E
   * Expected: Two paths [A, B, D] and [A, C, E]
   */
  it('should extract all paths from a branching tree', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      [
        'node-a',
        {
          id: 'node-a',
          title: 'Fork in Road',
          content: 'You reach a fork in the road.',
        },
      ],
      [
        'node-b',
        {
          id: 'node-b',
          title: 'Left Path',
          content: 'You take the left path.',
          decisionText: 'Go left',
        },
      ],
      [
        'node-c',
        {
          id: 'node-c',
          title: 'Right Path',
          content: 'You take the right path.',
          decisionText: 'Go right',
        },
      ],
      [
        'node-d',
        {
          id: 'node-d',
          title: 'Left Ending',
          content: 'You find a treasure!',
          decisionText: 'Open chest',
        },
      ],
      [
        'node-e',
        {
          id: 'node-e',
          title: 'Right Ending',
          content: 'You meet a wise sage.',
          decisionText: 'Talk to sage',
        },
      ],
    ]);

    const structure: TreeStructure = {
      'node-a': ['node-b', 'node-c'], // A branches to B or C
      'node-b': ['node-d'], // B leads to D
      'node-c': ['node-e'], // C leads to E
      'node-d': [], // Leaf
      'node-e': [], // Leaf
    };

    const rootId = 'node-a';

    // Act
    const paths = traverseTree(nodes, structure, rootId);

    // Assert
    expect(paths).toHaveLength(2); // Two possible paths

    // Check first path (A → B → D)
    const path1 = paths.find(p => p.nodeIds.includes('node-b'));
    expect(path1).toBeDefined();
    expect(path1!.nodeIds).toEqual(['node-a', 'node-b', 'node-d']);
    expect(path1!.decisions).toEqual(['Go left', 'Open chest']);

    // Check second path (A → C → E)
    const path2 = paths.find(p => p.nodeIds.includes('node-c'));
    expect(path2).toBeDefined();
    expect(path2!.nodeIds).toEqual(['node-a', 'node-c', 'node-e']);
    expect(path2!.decisions).toEqual(['Go right', 'Talk to sage']);
  });

  /**
   * Test Case 3: Tree with convergence (diamond pattern)
   * Structure:
   *        A
   *       / \
   *      B   C
   *       \ /
   *        D
   * Expected: Two paths [A, B, D] and [A, C, D]
   */
  it('should handle trees where multiple branches converge', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      [
        'node-a',
        { id: 'node-a', title: 'Start', content: 'Begin' },
      ],
      [
        'node-b',
        {
          id: 'node-b',
          title: 'Path B',
          content: 'B',
          decisionText: 'Choose B',
        },
      ],
      [
        'node-c',
        {
          id: 'node-c',
          title: 'Path C',
          content: 'C',
          decisionText: 'Choose C',
        },
      ],
      [
        'node-d',
        {
          id: 'node-d',
          title: 'Converged',
          content: 'Paths meet',
          decisionText: 'Continue',
        },
      ],
    ]);

    const structure: TreeStructure = {
      'node-a': ['node-b', 'node-c'], // A branches to B or C
      'node-b': ['node-d'], // B leads to D
      'node-c': ['node-d'], // C also leads to D (convergence)
      'node-d': [], // Leaf
    };

    const rootId = 'node-a';

    // Act
    const paths = traverseTree(nodes, structure, rootId);

    // Assert
    expect(paths).toHaveLength(2); // Two distinct paths despite convergence
    expect(paths[0].nodeIds).toEqual(['node-a', 'node-b', 'node-d']);
    expect(paths[1].nodeIds).toEqual(['node-a', 'node-c', 'node-d']);
  });

  /**
   * Test Case 4: Single root node with no children
   * Structure: A (standalone)
   * Expected: One path [A]
   */
  it('should handle a single node with no children', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      [
        'node-a',
        { id: 'node-a', title: 'Only Node', content: 'The end.' },
      ],
    ]);

    const structure: TreeStructure = {
      'node-a': [], // No children
    };

    const rootId = 'node-a';

    // Act
    const paths = traverseTree(nodes, structure, rootId);

    // Assert
    expect(paths).toHaveLength(1);
    expect(paths[0].nodeIds).toEqual(['node-a']);
    expect(paths[0].nodes).toHaveLength(1);
    expect(paths[0].decisions).toEqual([]); // No decisions in single-node path
  });

  /**
   * Test Case 5: Invalid root node (doesn't exist)
   * Expected: Throw an error with helpful message
   */
  it('should throw error if root node does not exist in nodes map', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-a', { id: 'node-a', title: 'A', content: 'Content A' }],
    ]);

    const structure: TreeStructure = {
      'node-a': [],
    };

    const rootId = 'node-nonexistent'; // Invalid root

    // Act & Assert
    expect(() => traverseTree(nodes, structure, rootId)).toThrow(
      'Root node "node-nonexistent" not found in nodes map'
    );
  });

  /**
   * Test Case 6: Missing child node in structure
   * Structure references a child that doesn't exist in nodes map
   * Expected: Throw an error
   */
  it('should throw error if child node referenced but not in nodes map', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-a', { id: 'node-a', title: 'A', content: 'Content A' }],
    ]);

    const structure: TreeStructure = {
      'node-a': ['node-missing'], // References node that doesn't exist
    };

    const rootId = 'node-a';

    // Act & Assert
    expect(() => traverseTree(nodes, structure, rootId)).toThrow(
      'Child node "node-missing" not found in nodes map'
    );
  });

  /**
   * Test Case 7: Circular reference (self-loop)
   * Structure: A → A (node points to itself)
   * Expected: Throw error with cycle information
   */
  it('should detect and throw error on self-referencing circular loop', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-a', { id: 'node-a', title: 'Loop', content: 'Infinite loop' }],
    ]);

    const structure: TreeStructure = {
      'node-a': ['node-a'], // Points to itself!
    };

    const rootId = 'node-a';

    // Act & Assert
    expect(() => traverseTree(nodes, structure, rootId)).toThrow(/circular reference/i);
    expect(() => traverseTree(nodes, structure, rootId)).toThrow(/node-a/);
  });

  /**
   * Test Case 8: Circular reference (two-node cycle)
   * Structure: A → B → A
   * Expected: Throw error showing the cycle
   */
  it('should detect circular reference in two-node cycle', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      [
        'node-a',
        {
          id: 'node-a',
          title: 'A',
          content: 'Node A',
          decisionText: 'Go to A',
        },
      ],
      [
        'node-b',
        {
          id: 'node-b',
          title: 'B',
          content: 'Node B',
          decisionText: 'Go to B',
        },
      ],
    ]);

    const structure: TreeStructure = {
      'node-a': ['node-b'],
      'node-b': ['node-a'], // Creates cycle: A → B → A
    };

    const rootId = 'node-a';

    // Act & Assert
    expect(() => traverseTree(nodes, structure, rootId)).toThrow(/circular reference/i);
    expect(() => traverseTree(nodes, structure, rootId)).toThrow(/node-a.*node-b/);
  });

  /**
   * Test Case 9: Circular reference in deeper tree
   * Structure:
   *    A
   *    |
   *    B
   *   / \
   *  C   D
   *  |
   *  A  (cycles back to root)
   *
   * Expected: Detect cycle and show full path
   */
  it('should detect circular reference deep in tree', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-a', { id: 'node-a', title: 'A', content: 'Root' }],
      [
        'node-b',
        { id: 'node-b', title: 'B', content: 'Level 1', decisionText: 'To B' },
      ],
      [
        'node-c',
        { id: 'node-c', title: 'C', content: 'Level 2', decisionText: 'To C' },
      ],
      [
        'node-d',
        { id: 'node-d', title: 'D', content: 'Level 2', decisionText: 'To D' },
      ],
    ]);

    const structure: TreeStructure = {
      'node-a': ['node-b'],
      'node-b': ['node-c', 'node-d'],
      'node-c': ['node-a'], // Cycle back to root
      'node-d': [], // Valid leaf
    };

    const rootId = 'node-a';

    // Act & Assert
    expect(() => traverseTree(nodes, structure, rootId)).toThrow(/circular reference/i);
    // Should mention the path: A → B → C → A
    expect(() => traverseTree(nodes, structure, rootId)).toThrow(/node-a.*node-b.*node-c/);
  });

  /**
   * Test Case 10: Tree with valid convergence should NOT be flagged as circular
   * Structure:
   *        A
   *       / \
   *      B   C
   *       \ /
   *        D
   * This is NOT circular - D is visited via two different paths
   */
  it('should NOT throw circular reference error for valid convergence', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-a', { id: 'node-a', title: 'A', content: 'Start' }],
      [
        'node-b',
        { id: 'node-b', title: 'B', content: 'Path B', decisionText: 'B' },
      ],
      [
        'node-c',
        { id: 'node-c', title: 'C', content: 'Path C', decisionText: 'C' },
      ],
      [
        'node-d',
        { id: 'node-d', title: 'D', content: 'End', decisionText: 'D' },
      ],
    ]);

    const structure: TreeStructure = {
      'node-a': ['node-b', 'node-c'],
      'node-b': ['node-d'],
      'node-c': ['node-d'],
      'node-d': [],
    };

    const rootId = 'node-a';

    // Act & Assert - should NOT throw
    expect(() => traverseTree(nodes, structure, rootId)).not.toThrow();

    // Should return valid paths
    const paths = traverseTree(nodes, structure, rootId);
    expect(paths).toHaveLength(2);
  });
});

describe('concatenatePath', () => {
  /**
   * Test Case 1: Concatenate a simple linear path
   * Expected: Combines title and content for each node, separated by newlines
   */
  it('should concatenate all nodes in a path into a single narrative', () => {
    // Arrange
    const path: StoryPath = {
      nodeIds: ['node-a', 'node-b', 'node-c'],
      nodes: [
        {
          id: 'node-a',
          title: 'The Beginning',
          content: 'You wake up in a dark forest.',
        },
        {
          id: 'node-b',
          title: 'The Path',
          content: 'You walk down a narrow path.',
          decisionText: 'Follow the path',
        },
        {
          id: 'node-c',
          title: 'The End',
          content: 'You reach a clearing and see the sunrise.',
          decisionText: 'Enter the clearing',
        },
      ],
      decisions: ['Follow the path', 'Enter the clearing'],
    };

    // Act
    const narrative = concatenatePath(path);

    // Assert
    expect(narrative).toContain('The Beginning');
    expect(narrative).toContain('You wake up in a dark forest.');
    expect(narrative).toContain('The Path');
    expect(narrative).toContain('You walk down a narrow path.');
    expect(narrative).toContain('The End');
    expect(narrative).toContain('You reach a clearing and see the sunrise.');

    // Should be properly formatted with newlines
    expect(narrative.split('\n\n').length).toBeGreaterThan(1);
  });

  /**
   * Test Case 2: Include decision text in the narrative
   * Expected: Decision text should appear between nodes to show player choices
   */
  it('should include decision text to show player choices', () => {
    // Arrange
    const path: StoryPath = {
      nodeIds: ['node-a', 'node-b'],
      nodes: [
        {
          id: 'node-a',
          title: 'Fork in Road',
          content: 'You see two paths.',
        },
        {
          id: 'node-b',
          title: 'Left Path',
          content: 'You chose the left path.',
          decisionText: 'Take the left path',
        },
      ],
      decisions: ['Take the left path'],
    };

    // Act
    const narrative = concatenatePath(path);

    // Assert
    expect(narrative).toContain('Take the left path');

    // Decision should appear between the nodes
    const aIndex = narrative.indexOf('You see two paths');
    const decisionIndex = narrative.indexOf('Take the left path');
    const bIndex = narrative.indexOf('You chose the left path');

    expect(decisionIndex).toBeGreaterThan(aIndex);
    expect(bIndex).toBeGreaterThan(decisionIndex);
  });

  /**
   * Test Case 3: Single node path (no decisions)
   * Expected: Just the single node's content
   */
  it('should handle single-node paths without decisions', () => {
    // Arrange
    const path: StoryPath = {
      nodeIds: ['node-a'],
      nodes: [
        {
          id: 'node-a',
          title: 'Standalone',
          content: 'This is the only scene.',
        },
      ],
      decisions: [],
    };

    // Act
    const narrative = concatenatePath(path);

    // Assert
    expect(narrative).toContain('Standalone');
    expect(narrative).toContain('This is the only scene.');
    expect(narrative).not.toContain('undefined');
  });

  /**
   * Test Case 4: Nodes with metadata should not appear in narrative
   * Expected: Only title and content are included
   */
  it('should only include title and content, ignoring metadata', () => {
    // Arrange
    const path: StoryPath = {
      nodeIds: ['node-a'],
      nodes: [
        {
          id: 'node-a',
          title: 'Test Node',
          content: 'Test content.',
          metadata: {
            audioUrl: 'https://example.com/audio.mp3',
            reward: { xp: 100 },
          },
        },
      ],
      decisions: [],
    };

    // Act
    const narrative = concatenatePath(path);

    // Assert
    expect(narrative).toContain('Test Node');
    expect(narrative).toContain('Test content.');
    expect(narrative).not.toContain('audioUrl');
    expect(narrative).not.toContain('reward');
    expect(narrative).not.toContain('100');
  });

  /**
   * Test Case 5: Format should be LLM-friendly
   * Expected: Clean, readable format suitable for analysis
   */
  it('should produce clean, LLM-friendly formatting', () => {
    // Arrange
    const path: StoryPath = {
      nodeIds: ['node-a', 'node-b'],
      nodes: [
        {
          id: 'node-a',
          title: 'Scene 1',
          content: 'First scene.',
        },
        {
          id: 'node-b',
          title: 'Scene 2',
          content: 'Second scene.',
          decisionText: 'Continue',
        },
      ],
      decisions: ['Continue'],
    };

    // Act
    const narrative = concatenatePath(path);

    // Assert
    // Should not have extra whitespace or formatting artifacts
    expect(narrative).not.toMatch(/\n{3,}/); // No more than 2 consecutive newlines
    expect(narrative).not.toMatch(/^\s+/); // No leading whitespace
    expect(narrative).not.toMatch(/\s+$/); // No trailing whitespace
    expect(narrative.trim()).toBe(narrative); // Already trimmed
  });
});

describe('buildPathFromNodes', () => {
  /**
   * Test Case 1: Build a valid path from manually selected nodes
   */
  it('should build a path from valid node IDs', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-1', { id: 'node-1', title: 'Start', content: 'Begin' }],
      [
        'node-2',
        {
          id: 'node-2',
          title: 'Middle',
          content: 'Continue',
          decisionText: 'Go forward',
        },
      ],
      [
        'node-3',
        {
          id: 'node-3',
          title: 'End',
          content: 'Finish',
          decisionText: 'Conclude',
        },
      ],
    ]);

    const nodeIds = ['node-1', 'node-2', 'node-3'];

    // Act
    const path = buildPathFromNodes(nodeIds, nodes);

    // Assert
    expect(path.nodeIds).toEqual(['node-1', 'node-2', 'node-3']);
    expect(path.nodes).toHaveLength(3);
    expect(path.nodes[0]?.id).toBe('node-1');
    expect(path.nodes[1]?.id).toBe('node-2');
    expect(path.nodes[2]?.id).toBe('node-3');
    expect(path.decisions).toEqual(['Go forward', 'Conclude']);
  });

  /**
   * Test Case 2: Validate path connections with structure
   */
  it('should validate path is valid when structure provided', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-1', { id: 'node-1', title: 'Start', content: 'Begin' }],
      ['node-2', { id: 'node-2', title: 'Middle', content: 'Continue' }],
    ]);

    const structure: TreeStructure = {
      'node-1': ['node-2'],
      'node-2': [],
    };

    const nodeIds = ['node-1', 'node-2'];

    // Act & Assert - should not throw
    expect(() =>
      buildPathFromNodes(nodeIds, nodes, structure)
    ).not.toThrow();
  });

  /**
   * Test Case 3: Throw error for invalid path connection
   */
  it('should throw error when nodes are not connected', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-1', { id: 'node-1', title: 'Start', content: 'Begin' }],
      ['node-2', { id: 'node-2', title: 'Middle', content: 'Continue' }],
      ['node-3', { id: 'node-3', title: 'Other', content: 'Different' }],
    ]);

    const structure: TreeStructure = {
      'node-1': ['node-2'], // node-1 only connects to node-2
      'node-2': [],
      'node-3': [],
    };

    const nodeIds = ['node-1', 'node-3']; // Invalid: node-1 doesn't connect to node-3

    // Act & Assert
    expect(() => buildPathFromNodes(nodeIds, nodes, structure)).toThrow(
      /does not connect to/
    );
  });

  /**
   * Test Case 4: Throw error for missing node
   */
  it('should throw error when node ID not found', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-1', { id: 'node-1', title: 'Start', content: 'Begin' }],
    ]);

    const nodeIds = ['node-1', 'nonexistent-node'];

    // Act & Assert
    expect(() => buildPathFromNodes(nodeIds, nodes)).toThrow(
      /not found in nodes map/
    );
  });

  /**
   * Test Case 5: Throw error for empty node list
   */
  it('should throw error for empty node ID list', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>();
    const nodeIds: string[] = [];

    // Act & Assert
    expect(() => buildPathFromNodes(nodeIds, nodes)).toThrow(
      /empty node list/
    );
  });

  /**
   * Test Case 6: Handle single node path
   */
  it('should handle a single-node path', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-1', { id: 'node-1', title: 'Only', content: 'Single' }],
    ]);

    const nodeIds = ['node-1'];

    // Act
    const path = buildPathFromNodes(nodeIds, nodes);

    // Assert
    expect(path.nodeIds).toEqual(['node-1']);
    expect(path.nodes).toHaveLength(1);
    expect(path.decisions).toEqual([]);
  });

  /**
   * Test Case 7: Handle nodes without decision text
   */
  it('should handle nodes missing decisionText gracefully', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-1', { id: 'node-1', title: 'Start', content: 'Begin' }],
      ['node-2', { id: 'node-2', title: 'Middle', content: 'Continue' }], // No decisionText
    ]);

    const nodeIds = ['node-1', 'node-2'];

    // Act
    const path = buildPathFromNodes(nodeIds, nodes);

    // Assert
    expect(path.decisions).toEqual([]); // No decisions since node-2 has no decisionText
  });

  /**
   * Test Case 8: Validation is optional
   */
  it('should allow invalid paths when structure not provided', () => {
    // Arrange
    const nodes = new Map<string, StoryNode>([
      ['node-1', { id: 'node-1', title: 'Start', content: 'Begin' }],
      ['node-3', { id: 'node-3', title: 'Other', content: 'Different' }],
    ]);

    // Invalid path (no connection), but no structure provided for validation
    const nodeIds = ['node-1', 'node-3'];

    // Act & Assert - should NOT throw because no structure provided
    expect(() => buildPathFromNodes(nodeIds, nodes)).not.toThrow();
  });
});
