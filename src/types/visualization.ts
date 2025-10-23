/**
 * Types for React Flow tree visualization.
 * @module types/visualization
 */

import type { Node, Edge } from '@xyflow/react';
import type { StoryNode } from './story';

/**
 * Layout direction for the tree visualization.
 */
export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';
// TB = Top to Bottom, BT = Bottom to Top, LR = Left to Right, RL = Right to Left

/**
 * Configuration options for the Dagre layout algorithm.
 */
export interface LayoutOptions {
  /** Direction of the tree layout. Default: 'TB' (top to bottom) */
  direction?: LayoutDirection;

  /** Horizontal spacing between nodes in pixels. Default: 80 */
  nodeSpacing?: number;

  /** Vertical spacing between ranks/levels in pixels. Default: 120 */
  rankSpacing?: number;
}

/**
 * Data attached to each React Flow node.
 * Contains the story node and additional UI state.
 */
export interface FlowNodeData extends Record<string, unknown> {
  /** The story node data */
  storyNode: StoryNode;

  /** Whether this node is a leaf (no children) */
  isLeaf: boolean;

  /** Whether this node is in an error state */
  hasError?: boolean;

  /** Error message if hasError is true */
  errorMessage?: string;

  /** Whether this node is currently loading */
  isLoading?: boolean;

  /** Custom CSS class for styling */
  className?: string;

  /** Optional click handler for this specific node */
  onClick?: (nodeId: string) => void;
}

/**
 * React Flow node with our custom data type.
 */
export type FlowNode = Node<FlowNodeData>;

/**
 * Data attached to each React Flow edge.
 */
export interface FlowEdgeData extends Record<string, unknown> {
  /** Decision text shown on the edge */
  label?: string;
}

/**
 * React Flow edge with our custom data type.
 */
export type FlowEdge = Edge<FlowEdgeData>;

/**
 * Theme/styling options for the tree visualization.
 */
export interface VisualizationTheme {
  /** Primary color for nodes. Default: '#2196f3' */
  primaryColor?: string;

  /** Color for leaf nodes. Default: '#f44336' */
  leafColor?: string;

  /** Color for error nodes. Default: '#d32f2f' */
  errorColor?: string;

  /** Background color for node cards. Default: '#ffffff' */
  nodeBackgroundColor?: string;

  /** Text color. Default: '#000000' */
  textColor?: string;

  /** Edge color. Default: '#b1b1b7' */
  edgeColor?: string;

  /** Edge type: 'default', 'step', 'smoothstep', 'straight'. Default: 'smoothstep' */
  edgeType?: 'default' | 'step' | 'smoothstep' | 'straight';
}

/**
 * Props for the main QuestTree component.
 */
export interface QuestTreeProps {
  /** Map of node ID to story node */
  nodes: Map<string, StoryNode>;

  /** Tree structure defining the branching */
  structure: { [nodeId: string]: string[] };

  /** ID of the root node. If not provided, will attempt to find it */
  rootNodeId?: string;

  /** Layout configuration */
  layout?: LayoutOptions;

  /** Visual theme/styling */
  theme?: VisualizationTheme;

  /** Whether to show the minimap. Default: true */
  showMinimap?: boolean;

  /** Whether to show controls (zoom, fit view). Default: true */
  showControls?: boolean;

  /** Whether to show the background grid. Default: true */
  showBackground?: boolean;

  /** Callback when a node is clicked */
  onNodeClick?: (node: StoryNode) => void;

  /** Callback when an edge is clicked */
  onEdgeClick?: (sourceId: string, targetId: string) => void;

  /** Custom node renderer (for advanced customization) */
  renderNode?: (node: FlowNode) => React.ReactNode;

  /** CSS class for the container */
  className?: string;

  /** Inline styles for the container */
  style?: React.CSSProperties;
}
