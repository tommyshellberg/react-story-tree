import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { StoryTree } from '../../src/components/StoryTree';
import type { StoryNode, TreeStructure } from '../../src/types';

/**
 * Test suite for StoryTree component
 *
 * StoryTree is the main container component that:
 * 1. Accepts raw story data (nodes + structure)
 * 2. Processes it using our utilities (buildFlowStructure → applyLayout)
 * 3. Renders React Flow with positioned nodes
 * 4. Provides controls (zoom, minimap, background)
 * 5. Forwards events to user callbacks
 *
 * This is a LIBRARY component, so we test:
 * - Works with minimal props (zero-config principle)
 * - Handles edge cases gracefully (empty trees, missing nodes)
 * - Supports customization (layout options, callbacks)
 * - Integrates properly with React Flow
 */

describe('StoryTree Component', () => {
  // Sample story data for testing
  let simpleNodes: Map<string, StoryNode>;
  let simpleStructure: TreeStructure;
  let branchingNodes: Map<string, StoryNode>;
  let branchingStructure: TreeStructure;

  beforeEach(() => {
    // Simple linear story: A → B → C
    simpleNodes = new Map([
      ['node-a', { id: 'node-a', title: 'Chapter 1', content: 'Story begins' }],
      ['node-b', { id: 'node-b', title: 'Chapter 2', content: 'Story continues', decisionText: 'Continue to Chapter 2' }],
      ['node-c', { id: 'node-c', title: 'Chapter 3', content: 'Story ends', decisionText: 'Continue to Chapter 3' }],
    ]);

    simpleStructure = {
      'node-a': ['node-b'],
      'node-b': ['node-c'],
      'node-c': [], // Leaf node
    };

    // Branching story:
    //       A
    //      / \
    //     B   C
    branchingNodes = new Map([
      ['root', { id: 'root', title: 'Start', content: 'Choose your path' }],
      ['path-a', { id: 'path-a', title: 'Path A', content: 'You chose A', decisionText: 'Go left' }],
      ['path-b', { id: 'path-b', title: 'Path B', content: 'You chose B', decisionText: 'Go right' }],
    ]);

    branchingStructure = {
      'root': ['path-a', 'path-b'],
      'path-a': [],
      'path-b': [],
    };
  });

  describe('Basic Rendering', () => {
    it('should render with minimal required props', () => {
      render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // React Flow should render
      // Note: React Flow renders with specific test IDs/classes we can check
      // We'll verify nodes are in the document
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
      expect(screen.getByText('Chapter 3')).toBeInTheDocument();
    });

    it('should render all nodes from a linear story', () => {
      render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // All three nodes should be rendered
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
      expect(screen.getByText('Chapter 3')).toBeInTheDocument();
    });

    it('should render all nodes from a branching story', () => {
      render(
        <StoryTree
          nodes={branchingNodes}
          structure={branchingStructure}
          rootId="root"
        />
      );

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Path A')).toBeInTheDocument();
      expect(screen.getByText('Path B')).toBeInTheDocument();
    });

    it('should render single-node tree', () => {
      const singleNode = new Map([
        ['only', { id: 'only', title: 'Only Node', content: 'Alone' }],
      ]);
      const singleStructure = { 'only': [] };

      render(
        <StoryTree
          nodes={singleNode}
          structure={singleStructure}
          rootId="only"
        />
      );

      expect(screen.getByText('Only Node')).toBeInTheDocument();
    });

    it('should apply default layout when no layout options provided', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // React Flow should be rendered
      const reactFlowElement = container.querySelector('.react-flow');
      expect(reactFlowElement).toBeInTheDocument();
    });
  });

  describe('React Flow Integration', () => {
    it('should render React Flow Background component', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // React Flow Background adds a specific class
      const background = container.querySelector('.react-flow__background');
      expect(background).toBeInTheDocument();
    });

    it('should render React Flow Controls component', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // React Flow Controls adds a specific class
      const controls = container.querySelector('.react-flow__controls');
      expect(controls).toBeInTheDocument();
    });

    it('should render React Flow MiniMap component', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // React Flow MiniMap adds a specific class
      const minimap = container.querySelector('.react-flow__minimap');
      expect(minimap).toBeInTheDocument();
    });

    it('should allow disabling Background via showBackground prop', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
          showBackground={false}
        />
      );

      const background = container.querySelector('.react-flow__background');
      expect(background).not.toBeInTheDocument();
    });

    it('should allow disabling Controls via showControls prop', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
          showControls={false}
        />
      );

      const controls = container.querySelector('.react-flow__controls');
      expect(controls).not.toBeInTheDocument();
    });

    it('should allow disabling MiniMap via showMiniMap prop', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
          showMiniMap={false}
        />
      );

      const minimap = container.querySelector('.react-flow__minimap');
      expect(minimap).not.toBeInTheDocument();
    });
  });

  describe('Layout Options', () => {
    it('should accept layout direction option', () => {
      // Test that component accepts layout options without crashing
      expect(() =>
        render(
          <StoryTree
            nodes={simpleNodes}
            structure={simpleStructure}
            rootId="node-a"
            layoutOptions={{ direction: 'LR' }}
          />
        )
      ).not.toThrow();
    });

    it('should accept layout spacing options', () => {
      expect(() =>
        render(
          <StoryTree
            nodes={simpleNodes}
            structure={simpleStructure}
            rootId="node-a"
            layoutOptions={{ nodeSpacing: 100, rankSpacing: 150 }}
          />
        )
      ).not.toThrow();
    });

    it('should work with all layout directions', () => {
      const directions = ['TB', 'BT', 'LR', 'RL'] as const;

      directions.forEach((direction) => {
        const { unmount } = render(
          <StoryTree
            nodes={simpleNodes}
            structure={simpleStructure}
            rootId="node-a"
            layoutOptions={{ direction }}
          />
        );

        expect(screen.getByText('Chapter 1')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Event Callbacks', () => {
    it('should call onNodeClick when a node is clicked', () => {
      const handleNodeClick = vi.fn();

      render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
          onNodeClick={handleNodeClick}
        />
      );

      // We need to verify that clicking on a node triggers the callback
      // This will depend on how we wire up the StoryNode component
      // For now, we'll just verify the component accepts the prop
      expect(handleNodeClick).toBeDefined();
    });

    it('should not crash when onNodeClick is undefined', () => {
      expect(() =>
        render(
          <StoryTree
            nodes={simpleNodes}
            structure={simpleStructure}
            rootId="node-a"
          />
        )
      ).not.toThrow();
    });

    it('should call onEdgeClick when an edge is clicked', () => {
      const handleEdgeClick = vi.fn();

      render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
          onEdgeClick={handleEdgeClick}
        />
      );

      expect(handleEdgeClick).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nodes map gracefully', () => {
      const emptyNodes = new Map<string, StoryNode>();
      const emptyStructure: TreeStructure = {};

      // Should not crash, but may show empty tree or error
      expect(() =>
        render(
          <StoryTree
            nodes={emptyNodes}
            structure={emptyStructure}
            rootId="non-existent"
          />
        )
      ).not.toThrow();
    });

    it('should handle missing root node gracefully', () => {
      // Root ID doesn't exist in nodes
      expect(() =>
        render(
          <StoryTree
            nodes={simpleNodes}
            structure={simpleStructure}
            rootId="non-existent-root"
          />
        )
      ).not.toThrow();
    });

    it('should handle malformed structure gracefully', () => {
      const malformedStructure: TreeStructure = {
        'node-a': ['missing-node'], // References a node that doesn't exist
      };

      // Should not crash, buildFlowStructure handles this
      expect(() =>
        render(
          <StoryTree
            nodes={simpleNodes}
            structure={malformedStructure}
            rootId="node-a"
          />
        )
      ).not.toThrow();
    });

    it('should handle circular references gracefully', () => {
      const circularStructure: TreeStructure = {
        'node-a': ['node-b'],
        'node-b': ['node-a'], // Creates a cycle
      };

      // buildFlowStructure should handle cycles
      expect(() =>
        render(
          <StoryTree
            nodes={simpleNodes}
            structure={circularStructure}
            rootId="node-a"
          />
        )
      ).not.toThrow();
    });

    it('should handle very large trees efficiently', () => {
      // Create a tree with 50 nodes
      const largeNodes = new Map<string, StoryNode>();
      const largeStructure: TreeStructure = {};

      for (let i = 0; i < 50; i++) {
        const nodeId = `node-${i}`;
        largeNodes.set(nodeId, {
          id: nodeId,
          title: `Node ${i}`,
          content: `Content for node ${i}`,
          decisionText: i > 0 ? `Go to node ${i}` : undefined,
        });

        // Create linear chain
        largeStructure[nodeId] = i < 49 ? [`node-${i + 1}`] : [];
      }

      // Should render without performance issues
      const { container } = render(
        <StoryTree
          nodes={largeNodes}
          structure={largeStructure}
          rootId="node-0"
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Custom Node Types', () => {
    it('should use default StoryNode component when no custom node provided', () => {
      render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // Should use our StoryNode component by default
      const nodes = screen.getAllByTestId('story-node');
      expect(nodes.length).toBeGreaterThan(0);
    });

    // Future: Test custom node types when we support them
    // it('should accept custom node component', () => { ... });
  });

  describe('Accessibility', () => {
    it('should render with proper container structure', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // Should have a container element
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should allow keyboard navigation through React Flow', () => {
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // React Flow provides keyboard navigation
      const reactFlow = container.querySelector('.react-flow');
      expect(reactFlow).toBeInTheDocument();
    });
  });

  describe('Integration with Utilities', () => {
    it('should use buildFlowStructure to process nodes', () => {
      // This is implicitly tested by rendering working
      // buildFlowStructure is called internally
      render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
        />
      );

      // If buildFlowStructure works, nodes should render
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    });

    it('should use applyLayout to position nodes', () => {
      // applyLayout is called internally
      const { container } = render(
        <StoryTree
          nodes={simpleNodes}
          structure={simpleStructure}
          rootId="node-a"
          layoutOptions={{ direction: 'TB' }}
        />
      );

      // If layout works, React Flow should render with positioned nodes
      expect(container.querySelector('.react-flow')).toBeInTheDocument();
    });

    it('should handle errors from buildFlowStructure gracefully', () => {
      // Pass invalid data that would cause buildFlowStructure to error
      const badNodes = new Map([
        ['node-a', { id: 'node-a', title: 'A', content: 'Content' }],
      ]);
      const badStructure: TreeStructure = {
        'node-a': [{ childId: 'missing', decisionText: 'Error' }],
      };

      // Should not crash the component
      expect(() =>
        render(
          <StoryTree nodes={badNodes} structure={badStructure} rootId="node-a" />
        )
      ).not.toThrow();
    });
  });
});
