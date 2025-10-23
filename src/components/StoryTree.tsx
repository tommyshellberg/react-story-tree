/**
 * StoryTree - Main container component for interactive branching narrative visualization
 *
 * @module components/StoryTree
 */

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StoryNode } from './StoryNode';
import { buildFlowStructure } from '../utils/flow-builder';
import { applyLayout } from '../utils/layout';
import type { StoryNode as StoryNodeType, TreeStructure, LayoutOptions } from '../types';

/**
 * Props for the StoryTree component
 */
export interface StoryTreeProps {
  /** Map of node IDs to story node data */
  nodes: Map<string, StoryNodeType>;

  /** Tree structure defining parent-child relationships */
  structure: TreeStructure;

  /** ID of the root node to start traversal from */
  rootId: string;

  /** Optional layout configuration (direction, spacing) */
  layoutOptions?: LayoutOptions;

  /** Called when a node is clicked */
  onNodeClick?: (nodeId: string) => void;

  /** Called when an edge is clicked */
  onEdgeClick?: (edgeId: string) => void;

  /** Show background grid (default: true) */
  showBackground?: boolean;

  /** Show zoom/pan controls (default: true) */
  showControls?: boolean;

  /** Show minimap (default: true) */
  showMiniMap?: boolean;

  /** Custom CSS class for the container */
  className?: string;

  /** Custom inline styles for the container */
  style?: React.CSSProperties;
}

const nodeTypes = {
  storyNode: StoryNode,
};

/**
 * Inner component with access to React Flow context
 */
const StoryTreeInner: React.FC<StoryTreeProps> = ({
  nodes,
  structure,
  rootId,
  layoutOptions,
  onNodeClick,
  onEdgeClick,
  showBackground = true,
  showControls = true,
  showMiniMap = true,
  className,
  style,
}) => {
  // Build flow structure from story data
  const flowStructure = useMemo(() => {
    try {
      return buildFlowStructure(nodes, structure, rootId);
    } catch (error) {
      console.error('Failed to build flow structure:', error);
      return { nodes: [], edges: [] };
    }
  }, [nodes, structure, rootId]);

  // Apply layout algorithm to position nodes
  const flowNodes = useMemo(() => {
    try {
      return applyLayout(flowStructure.nodes, flowStructure.edges, layoutOptions);
    } catch (error) {
      console.error('Failed to apply layout:', error);
      return flowStructure.nodes;
    }
  }, [flowStructure, layoutOptions]);

  // Edges don't need layout, use directly from flow structure
  const flowEdges = flowStructure.edges;

  // Convert to React Flow format
  const reactFlowNodes: Node[] = useMemo(() => {
    return flowNodes.map((node) => ({
      id: node.id,
      type: 'storyNode',
      position: node.position,
      data: {
        ...node.data,
        onClick: onNodeClick,
      },
    }));
  }, [flowNodes, onNodeClick]);

  const reactFlowEdges: Edge[] = useMemo(() => {
    return flowEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.data?.decisionText as string | undefined,
      type: edge.type,
      style: edge.style,
      labelStyle: edge.labelStyle,
      labelBgStyle: edge.labelBgStyle,
    }));
  }, [flowEdges]);

  // React Flow internal state handlers
  const onNodesChange: OnNodesChange = useCallback((_changes: NodeChange[]) => {
    // No-op for now - could forward to prop callback if needed
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // No-op for now
  }, []);

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge.id);
      }
    },
    [onEdgeClick]
  );

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '600px',
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 2,
        }}
        minZoom={0.05}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        {showBackground && <Background />}
        {showControls && <Controls />}
        {showMiniMap && <MiniMap nodeStrokeWidth={3} zoomable pannable />}
      </ReactFlow>
    </div>
  );
};

/**
 * StoryTree - Main component with ReactFlowProvider wrapper
 *
 * @example
 * ```tsx
 * const nodes = new Map([
 *   ['start', { id: 'start', title: 'Beginning', content: 'Story starts here' }],
 *   ['end', { id: 'end', title: 'Ending', content: 'The end' }],
 * ]);
 *
 * const structure = {
 *   'start': [{ childId: 'end', decisionText: 'Continue' }],
 *   'end': [],
 * };
 *
 * <StoryTree nodes={nodes} structure={structure} rootId="start" />
 * ```
 */
export const StoryTree: React.FC<StoryTreeProps> = (props) => {
  return (
    <ReactFlowProvider>
      <StoryTreeInner {...props} />
    </ReactFlowProvider>
  );
};
