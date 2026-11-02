import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type React from 'react';
import { StoryTree } from '../../src/components/StoryTree';
import type { StoryNode, TreeStructure } from '../../src/types';

/**
 * These tests check what StoryTree hands to React Flow.
 * React Flow only draws edges after it has measured the nodes, which never
 * happens in jsdom, so we replace ReactFlow with a stub that records its props.
 */

interface RecordedNode {
  id: string;
  data: { direction?: string; customStyle?: React.CSSProperties };
}

interface RecordedEdge {
  id: string;
  label?: unknown;
}

const recorded = vi.hoisted(() => ({
  nodes: [] as RecordedNode[],
  edges: [] as RecordedEdge[],
}));

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    ReactFlow: (props: { nodes: RecordedNode[]; edges: RecordedEdge[] }) => {
      recorded.nodes = props.nodes;
      recorded.edges = props.edges;
      return null;
    },
  };
});

describe('StoryTree: props handed to React Flow', () => {
  const nodes = new Map<string, StoryNode>([
    ['start', { id: 'start', title: 'Start', content: '', metadata: { track: 'real' } }],
    [
      'left',
      { id: 'left', title: 'Left', content: '', decisionText: 'Go left', metadata: { track: 'imagined' } },
    ],
    ['right', { id: 'right', title: 'Right', content: '' }],
  ]);
  const structure: TreeStructure = { start: ['left', 'right'], left: [], right: [] };

  const edgeLabel = (id: string) => recorded.edges.find((edge) => edge.id === id)?.label;

  beforeEach(() => {
    recorded.nodes = [];
    recorded.edges = [];
  });

  describe('edge labels', () => {
    it('labels each edge with the decision text of the node it leads to', () => {
      render(<StoryTree nodes={nodes} structure={structure} rootId="start" />);

      expect(edgeLabel('edge-start-left')).toBe('Go left');
    });

    it('leaves the label empty when the node has no decision text', () => {
      render(<StoryTree nodes={nodes} structure={structure} rootId="start" />);

      expect(edgeLabel('edge-start-right')).toBeUndefined();
    });
  });
});
