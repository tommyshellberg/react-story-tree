/**
 * Tests for Flow Builder utility.
 * Converts story tree structure to React Flow nodes and edges.
 */

import { describe, it, expect } from 'vitest';
import type { StoryNode, TreeStructure } from '../src/types/story';
import type { FlowNode, FlowEdge } from '../src/types/visualization';

// Import the functions we're testing
import { buildFlowStructure } from '../src/utils/flow-builder';

describe('buildFlowStructure', () => {
  describe('Basic Conversion', () => {
    it('should convert a single root node to a FlowNode', () => {
      const nodes = new Map<string, StoryNode>([
        [
          'node-1',
          {
            id: 'node-1',
            title: 'The Beginning',
            content: 'Your adventure starts here.',
          },
        ],
      ]);

      const structure: TreeStructure = {
        'node-1': [], // Leaf node (no children)
      };

      const result = buildFlowStructure(nodes, structure, 'node-1');

      // Should have exactly 1 node
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(0);

      // Verify node structure
      const flowNode = result.nodes[0];
      expect(flowNode.id).toBe('node-1');
      expect(flowNode.type).toBe('custom'); // We'll use custom node rendering
      expect(flowNode.data.storyNode).toEqual(nodes.get('node-1'));
      expect(flowNode.data.isLeaf).toBe(true);
    });

    it('should convert a simple linear path (A → B → C)', () => {
      const nodes = new Map<string, StoryNode>([
        ['node-a', { id: 'node-a', title: 'Start', content: 'Begin your journey.' }],
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
            content: 'Journey complete!',
            decisionText: 'Finish',
          },
        ],
      ]);

      const structure: TreeStructure = {
        'node-a': ['node-b'],
        'node-b': ['node-c'],
        'node-c': [],
      };

      const result = buildFlowStructure(nodes, structure, 'node-a');

      // Should have 3 nodes and 2 edges (A→B, B→C)
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);

      // Verify edges
      expect(result.edges[0]).toEqual({
        id: 'edge-node-a-node-b',
        source: 'node-a',
        target: 'node-b',
        type: 'smoothstep',
        data: { label: 'Go forward' },
      });

      expect(result.edges[1]).toEqual({
        id: 'edge-node-b-node-c',
        source: 'node-b',
        target: 'node-c',
        type: 'smoothstep',
        data: { label: 'Finish' },
      });
    });

    it('should convert a branching tree (one parent, two children)', () => {
      const nodes = new Map<string, StoryNode>([
        [
          'root',
          { id: 'root', title: 'Fork in the Road', content: 'Which path do you take?' },
        ],
        [
          'left',
          {
            id: 'left',
            title: 'Left Path',
            content: 'You go left.',
            decisionText: 'Take the left path',
          },
        ],
        [
          'right',
          {
            id: 'right',
            title: 'Right Path',
            content: 'You go right.',
            decisionText: 'Take the right path',
          },
        ],
      ]);

      const structure: TreeStructure = {
        root: ['left', 'right'],
        left: [],
        right: [],
      };

      const result = buildFlowStructure(nodes, structure, 'root');

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);

      // Both children should be marked as leaves
      const leftNode = result.nodes.find((n) => n.id === 'left');
      const rightNode = result.nodes.find((n) => n.id === 'right');
      expect(leftNode?.data.isLeaf).toBe(true);
      expect(rightNode?.data.isLeaf).toBe(true);

      // Root should not be a leaf
      const rootNode = result.nodes.find((n) => n.id === 'root');
      expect(rootNode?.data.isLeaf).toBe(false);
    });

    it('should handle a complex tree with multiple levels', () => {
      const nodes = new Map<string, StoryNode>([
        ['1', { id: '1', title: 'Root', content: 'Start' }],
        ['1a', { id: '1a', title: 'Branch A', content: 'Path A', decisionText: 'Go A' }],
        ['1b', { id: '1b', title: 'Branch B', content: 'Path B', decisionText: 'Go B' }],
        ['2a', { id: '2a', title: 'End A1', content: 'Done A1', decisionText: 'Finish A1' }],
        ['2b', { id: '2b', title: 'End A2', content: 'Done A2', decisionText: 'Finish A2' }],
        ['2c', { id: '2c', title: 'End B', content: 'Done B', decisionText: 'Finish B' }],
      ]);

      const structure: TreeStructure = {
        '1': ['1a', '1b'],
        '1a': ['2a', '2b'],
        '1b': ['2c'],
        '2a': [],
        '2b': [],
        '2c': [],
      };

      const result = buildFlowStructure(nodes, structure, '1');

      expect(result.nodes).toHaveLength(6);
      expect(result.edges).toHaveLength(5); // 1→1a, 1→1b, 1a→2a, 1a→2b, 1b→2c
    });
  });

  describe('Node Enrichment', () => {
    it('should correctly identify leaf nodes', () => {
      const nodes = new Map<string, StoryNode>([
        ['root', { id: 'root', title: 'Root', content: 'Start' }],
        ['child', { id: 'child', title: 'Child', content: 'End', decisionText: 'Go' }],
      ]);

      const structure: TreeStructure = {
        root: ['child'],
        child: [],
      };

      const result = buildFlowStructure(nodes, structure, 'root');

      const rootNode = result.nodes.find((n) => n.id === 'root');
      const childNode = result.nodes.find((n) => n.id === 'child');

      expect(rootNode?.data.isLeaf).toBe(false);
      expect(childNode?.data.isLeaf).toBe(true);
    });

    it('should preserve all original StoryNode data', () => {
      const originalNode: StoryNode = {
        id: 'test-node',
        title: 'Test Title',
        content: 'Test content',
        customId: 'custom-123',
        decisionText: 'Test decision',
        metadata: {
          difficulty: 'hard',
          hasAudio: true,
          tags: ['adventure', 'mystery'],
        },
      };

      const nodes = new Map<string, StoryNode>([['test-node', originalNode]]);

      const structure: TreeStructure = {
        'test-node': [],
      };

      const result = buildFlowStructure(nodes, structure, 'test-node');

      const flowNode = result.nodes[0];
      expect(flowNode.data.storyNode).toEqual(originalNode);
      expect(flowNode.data.storyNode.metadata).toEqual(originalNode.metadata);
    });
  });

  describe('Edge Creation', () => {
    it('should use decisionText as edge labels', () => {
      const nodes = new Map<string, StoryNode>([
        ['a', { id: 'a', title: 'A', content: 'Node A' }],
        [
          'b',
          {
            id: 'b',
            title: 'B',
            content: 'Node B',
            decisionText: 'Choose wisely',
          },
        ],
      ]);

      const structure: TreeStructure = {
        a: ['b'],
        b: [],
      };

      const result = buildFlowStructure(nodes, structure, 'a');

      expect(result.edges[0].data?.label).toBe('Choose wisely');
    });

    it('should handle missing decisionText gracefully', () => {
      const nodes = new Map<string, StoryNode>([
        ['a', { id: 'a', title: 'A', content: 'Node A' }],
        ['b', { id: 'b', title: 'B', content: 'Node B' }], // No decisionText
      ]);

      const structure: TreeStructure = {
        a: ['b'],
        b: [],
      };

      const result = buildFlowStructure(nodes, structure, 'a');

      // Should still create edge, just without label
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].data?.label).toBeUndefined();
    });

    it('should create unique edge IDs', () => {
      const nodes = new Map<string, StoryNode>([
        ['1', { id: '1', title: 'Root', content: 'Start' }],
        ['2', { id: '2', title: 'A', content: 'Path A' }],
        ['3', { id: '3', title: 'B', content: 'Path B' }],
      ]);

      const structure: TreeStructure = {
        '1': ['2', '3'],
        '2': [],
        '3': [],
      };

      const result = buildFlowStructure(nodes, structure, '1');

      const edgeIds = result.edges.map((e) => e.id);
      expect(edgeIds).toEqual(['edge-1-2', 'edge-1-3']);
      expect(new Set(edgeIds).size).toBe(2); // All unique
    });
  });

  describe('Error Handling', () => {
    it('should throw error if root node is not in nodes map', () => {
      const nodes = new Map<string, StoryNode>([
        ['node-1', { id: 'node-1', title: 'Node', content: 'Content' }],
      ]);

      const structure: TreeStructure = {
        'node-1': [],
      };

      expect(() => {
        buildFlowStructure(nodes, structure, 'nonexistent-root');
      }).toThrow('Root node "nonexistent-root" not found');
    });

    it('should throw error if child node referenced in structure does not exist', () => {
      const nodes = new Map<string, StoryNode>([
        ['root', { id: 'root', title: 'Root', content: 'Start' }],
      ]);

      const structure: TreeStructure = {
        root: ['missing-child'],
      };

      expect(() => {
        buildFlowStructure(nodes, structure, 'root');
      }).toThrow('Node "missing-child" referenced in structure but not found in nodes map');
    });

    it('should handle empty structure gracefully', () => {
      const nodes = new Map<string, StoryNode>([
        ['root', { id: 'root', title: 'Root', content: 'Alone' }],
      ]);

      const structure: TreeStructure = {};

      expect(() => {
        buildFlowStructure(nodes, structure, 'root');
      }).toThrow('Node "root" not found in tree structure');
    });

    it('should throw error for empty nodes map', () => {
      const nodes = new Map<string, StoryNode>();
      const structure: TreeStructure = {};

      expect(() => {
        buildFlowStructure(nodes, structure, 'any-id');
      }).toThrow('Nodes map is empty');
    });
  });

  describe('Convergent Paths', () => {
    it('should handle convergent paths (multiple parents, one child)', () => {
      // Tree structure:
      //     1
      //    / \
      //   2   3
      //    \ /
      //     4

      const nodes = new Map<string, StoryNode>([
        ['1', { id: '1', title: 'Root', content: 'Start' }],
        ['2', { id: '2', title: 'Left', content: 'Go left' }],
        ['3', { id: '3', title: 'Right', content: 'Go right' }],
        ['4', { id: '4', title: 'Converge', content: 'Paths merge' }],
      ]);

      const structure: TreeStructure = {
        '1': ['2', '3'],
        '2': ['4'],
        '3': ['4'],
        '4': [],
      };

      const result = buildFlowStructure(nodes, structure, '1');

      expect(result.nodes).toHaveLength(4);
      // Should have 4 edges: 1→2, 1→3, 2→4, 3→4
      expect(result.edges).toHaveLength(4);

      // Node 4 should be a leaf
      const node4 = result.nodes.find((n) => n.id === '4');
      expect(node4?.data.isLeaf).toBe(true);
    });
  });
});
