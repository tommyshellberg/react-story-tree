/**
 * Tests for Layout Engine utility.
 * Applies Dagre layout algorithm to position React Flow nodes.
 */

import { describe, it, expect } from 'vitest';
import type { FlowNode, FlowEdge, LayoutOptions } from '../src/types/visualization';
import type { StoryNode } from '../src/types/story';

// Import the function we're testing
import { applyLayout } from '../src/utils/layout';

describe('applyLayout', () => {
  // Helper to create a basic FlowNode
  const createFlowNode = (id: string, title: string): FlowNode => ({
    id,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      storyNode: {
        id,
        title,
        content: `Content for ${title}`,
      } as StoryNode,
      isLeaf: false,
    },
  });

  // Helper to create a basic FlowEdge
  const createFlowEdge = (source: string, target: string): FlowEdge => ({
    id: `edge-${source}-${target}`,
    source,
    target,
    type: 'smoothstep',
    data: {},
  });

  describe('Basic Layout', () => {
    it('should position a single node at origin', () => {
      const nodes: FlowNode[] = [createFlowNode('node-1', 'Single Node')];
      const edges: FlowEdge[] = [];

      const layoutedNodes = applyLayout(nodes, edges);

      expect(layoutedNodes).toHaveLength(1);
      // Dagre should position the node (not at exact 0,0 but somewhere reasonable)
      expect(layoutedNodes[0].position).toBeDefined();
      expect(typeof layoutedNodes[0].position.x).toBe('number');
      expect(typeof layoutedNodes[0].position.y).toBe('number');
    });

    it('should position two nodes vertically for TB (top-to-bottom) layout', () => {
      const nodes: FlowNode[] = [
        createFlowNode('parent', 'Parent'),
        createFlowNode('child', 'Child'),
      ];

      const edges: FlowEdge[] = [createFlowEdge('parent', 'child')];

      const layoutedNodes = applyLayout(nodes, edges, { direction: 'TB' });

      const parent = layoutedNodes.find((n) => n.id === 'parent')!;
      const child = layoutedNodes.find((n) => n.id === 'child')!;

      // In TB layout, parent should be above child (smaller y)
      expect(parent.position.y).toBeLessThan(child.position.y);
    });

    it('should position two nodes horizontally for LR (left-to-right) layout', () => {
      const nodes: FlowNode[] = [
        createFlowNode('parent', 'Parent'),
        createFlowNode('child', 'Child'),
      ];

      const edges: FlowEdge[] = [createFlowEdge('parent', 'child')];

      const layoutedNodes = applyLayout(nodes, edges, { direction: 'LR' });

      const parent = layoutedNodes.find((n) => n.id === 'parent')!;
      const child = layoutedNodes.find((n) => n.id === 'child')!;

      // In LR layout, parent should be left of child (smaller x)
      expect(parent.position.x).toBeLessThan(child.position.x);
    });

    it('should position nodes in reverse for BT (bottom-to-top) layout', () => {
      const nodes: FlowNode[] = [
        createFlowNode('parent', 'Parent'),
        createFlowNode('child', 'Child'),
      ];

      const edges: FlowEdge[] = [createFlowEdge('parent', 'child')];

      const layoutedNodes = applyLayout(nodes, edges, { direction: 'BT' });

      const parent = layoutedNodes.find((n) => n.id === 'parent')!;
      const child = layoutedNodes.find((n) => n.id === 'child')!;

      // In BT layout, parent should be below child (larger y)
      expect(parent.position.y).toBeGreaterThan(child.position.y);
    });

    it('should position nodes in reverse for RL (right-to-left) layout', () => {
      const nodes: FlowNode[] = [
        createFlowNode('parent', 'Parent'),
        createFlowNode('child', 'Child'),
      ];

      const edges: FlowEdge[] = [createFlowEdge('parent', 'child')];

      const layoutedNodes = applyLayout(nodes, edges, { direction: 'RL' });

      const parent = layoutedNodes.find((n) => n.id === 'parent')!;
      const child = layoutedNodes.find((n) => n.id === 'child')!;

      // In RL layout, parent should be right of child (larger x)
      expect(parent.position.x).toBeGreaterThan(child.position.x);
    });
  });

  describe('Branching Trees', () => {
    it('should position siblings side-by-side', () => {
      // Tree structure:
      //      parent
      //      /   \
      //   left   right

      const nodes: FlowNode[] = [
        createFlowNode('parent', 'Parent'),
        createFlowNode('left', 'Left Child'),
        createFlowNode('right', 'Right Child'),
      ];

      const edges: FlowEdge[] = [
        createFlowEdge('parent', 'left'),
        createFlowEdge('parent', 'right'),
      ];

      const layoutedNodes = applyLayout(nodes, edges, { direction: 'TB' });

      const parent = layoutedNodes.find((n) => n.id === 'parent')!;
      const left = layoutedNodes.find((n) => n.id === 'left')!;
      const right = layoutedNodes.find((n) => n.id === 'right')!;

      // Parent should be above both children
      expect(parent.position.y).toBeLessThan(left.position.y);
      expect(parent.position.y).toBeLessThan(right.position.y);

      // Children should be at same level (same y)
      expect(left.position.y).toBe(right.position.y);

      // Left and right should have different x positions
      expect(left.position.x).not.toBe(right.position.x);
    });

    it('should handle multi-level trees', () => {
      // Tree structure:
      //        1
      //       / \
      //      2   3
      //     /
      //    4

      const nodes: FlowNode[] = [
        createFlowNode('1', 'Root'),
        createFlowNode('2', 'Branch A'),
        createFlowNode('3', 'Branch B'),
        createFlowNode('4', 'Leaf'),
      ];

      const edges: FlowEdge[] = [
        createFlowEdge('1', '2'),
        createFlowEdge('1', '3'),
        createFlowEdge('2', '4'),
      ];

      const layoutedNodes = applyLayout(nodes, edges, { direction: 'TB' });

      const node1 = layoutedNodes.find((n) => n.id === '1')!;
      const node2 = layoutedNodes.find((n) => n.id === '2')!;
      const node3 = layoutedNodes.find((n) => n.id === '3')!;
      const node4 = layoutedNodes.find((n) => n.id === '4')!;

      // Verify hierarchy (y positions)
      expect(node1.position.y).toBeLessThan(node2.position.y);
      expect(node1.position.y).toBeLessThan(node3.position.y);
      expect(node2.position.y).toBeLessThan(node4.position.y);

      // Node 2 and 3 should be at same level
      expect(node2.position.y).toBe(node3.position.y);
    });
  });

  describe('Spacing Configuration', () => {
    it('should use custom node spacing', () => {
      const nodes: FlowNode[] = [
        createFlowNode('parent', 'Parent'),
        createFlowNode('left', 'Left'),
        createFlowNode('right', 'Right'),
      ];

      const edges: FlowEdge[] = [
        createFlowEdge('parent', 'left'),
        createFlowEdge('parent', 'right'),
      ];

      // Layout with small spacing
      const layoutSmall = applyLayout(nodes, edges, { nodeSpacing: 50 });
      const leftSmall = layoutSmall.find((n) => n.id === 'left')!;
      const rightSmall = layoutSmall.find((n) => n.id === 'right')!;
      const distanceSmall = Math.abs(rightSmall.position.x - leftSmall.position.x);

      // Layout with large spacing
      const layoutLarge = applyLayout(nodes, edges, { nodeSpacing: 200 });
      const leftLarge = layoutLarge.find((n) => n.id === 'left')!;
      const rightLarge = layoutLarge.find((n) => n.id === 'right')!;
      const distanceLarge = Math.abs(rightLarge.position.x - leftLarge.position.x);

      // Larger spacing should result in larger distance
      expect(distanceLarge).toBeGreaterThan(distanceSmall);
    });

    it('should use custom rank spacing', () => {
      const nodes: FlowNode[] = [
        createFlowNode('parent', 'Parent'),
        createFlowNode('child', 'Child'),
      ];

      const edges: FlowEdge[] = [createFlowEdge('parent', 'child')];

      // Layout with small rank spacing
      const layoutSmall = applyLayout(nodes, edges, { rankSpacing: 80 });
      const parentSmall = layoutSmall.find((n) => n.id === 'parent')!;
      const childSmall = layoutSmall.find((n) => n.id === 'child')!;
      const distanceSmall = Math.abs(childSmall.position.y - parentSmall.position.y);

      // Layout with large rank spacing
      const layoutLarge = applyLayout(nodes, edges, { rankSpacing: 300 });
      const parentLarge = layoutLarge.find((n) => n.id === 'parent')!;
      const childLarge = layoutLarge.find((n) => n.id === 'child')!;
      const distanceLarge = Math.abs(childLarge.position.y - parentLarge.position.y);

      // Larger spacing should result in larger distance
      expect(distanceLarge).toBeGreaterThan(distanceSmall);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nodes array', () => {
      const layoutedNodes = applyLayout([], []);
      expect(layoutedNodes).toEqual([]);
    });

    it('should handle nodes with no edges (disconnected graph)', () => {
      const nodes: FlowNode[] = [
        createFlowNode('node-1', 'Node 1'),
        createFlowNode('node-2', 'Node 2'),
      ];

      const layoutedNodes = applyLayout(nodes, []);

      // Should still position nodes (just not connected)
      expect(layoutedNodes).toHaveLength(2);
      expect(layoutedNodes[0].position).toBeDefined();
      expect(layoutedNodes[1].position).toBeDefined();
    });

    it('should preserve node data during layout', () => {
      const originalNode = createFlowNode('test', 'Test Node');
      originalNode.data.storyNode.metadata = { custom: 'data' };

      const layoutedNodes = applyLayout([originalNode], []);

      expect(layoutedNodes[0].data).toEqual(originalNode.data);
      expect(layoutedNodes[0].data.storyNode.metadata).toEqual({ custom: 'data' });
    });

    it('should use default options when not provided', () => {
      const nodes: FlowNode[] = [
        createFlowNode('parent', 'Parent'),
        createFlowNode('child', 'Child'),
      ];

      const edges: FlowEdge[] = [createFlowEdge('parent', 'child')];

      // Call without options - should use defaults
      const layoutedNodes = applyLayout(nodes, edges);

      expect(layoutedNodes).toHaveLength(2);
      // Default is TB, so parent should be above child
      const parent = layoutedNodes.find((n) => n.id === 'parent')!;
      const child = layoutedNodes.find((n) => n.id === 'child')!;
      expect(parent.position.y).toBeLessThan(child.position.y);
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

      const nodes: FlowNode[] = [
        createFlowNode('1', 'Root'),
        createFlowNode('2', 'Left'),
        createFlowNode('3', 'Right'),
        createFlowNode('4', 'Converge'),
      ];

      const edges: FlowEdge[] = [
        createFlowEdge('1', '2'),
        createFlowEdge('1', '3'),
        createFlowEdge('2', '4'),
        createFlowEdge('3', '4'),
      ];

      const layoutedNodes = applyLayout(nodes, edges, { direction: 'TB' });

      const node1 = layoutedNodes.find((n) => n.id === '1')!;
      const node2 = layoutedNodes.find((n) => n.id === '2')!;
      const node3 = layoutedNodes.find((n) => n.id === '3')!;
      const node4 = layoutedNodes.find((n) => n.id === '4')!;

      // All nodes should be positioned
      expect(node1.position).toBeDefined();
      expect(node2.position).toBeDefined();
      expect(node3.position).toBeDefined();
      expect(node4.position).toBeDefined();

      // Root should be at top
      expect(node1.position.y).toBeLessThan(node4.position.y);
    });
  });
});
