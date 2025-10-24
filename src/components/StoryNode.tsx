/**
 * StoryNode Component
 *
 * A custom React Flow node for displaying story content in a branching narrative tree.
 * This is a library component, so it must:
 * - Handle all edge cases gracefully (missing data, undefined fields)
 * - Provide clear visual feedback for different states (leaf, branch, error, loading)
 * - Be accessible (semantic HTML, ARIA attributes)
 * - Be performant (React.memo for React Flow optimization)
 * - Support customization via props
 *
 * @module components/StoryNode
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { FlowNodeData } from '../types';

// Define our own props interface to avoid NodeProps type constraint issues
interface StoryNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

/**
 * Custom CSS styles for the story node.
 * In a library, we use inline styles for core functionality to avoid CSS conflicts.
 * Consumers can override via className or custom theme.
 */
const styles = {
  node: {
    background: '#ffffff',
    border: '2px solid #b1b1b7',
    borderRadius: '8px',
    padding: '12px 16px',
    minWidth: '200px',
    maxWidth: '300px',
    fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,

  nodeSelected: {
    borderColor: '#2196f3',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
  } as React.CSSProperties,

  nodeLeaf: {
    borderColor: '#4caf50',
    background: '#f1f8e9',
  } as React.CSSProperties,

  nodeError: {
    borderColor: '#f44336',
    background: '#ffebee',
  } as React.CSSProperties,

  nodeLoading: {
    opacity: 0.6,
    pointerEvents: 'none' as const,
  } as React.CSSProperties,

  title: {
    fontWeight: 600,
    fontSize: '16px',
    marginBottom: '8px',
    color: '#1a1a1a',
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
  } as React.CSSProperties,

  content: {
    color: '#666',
    fontSize: '13px',
    lineHeight: '1.5',
    marginTop: '4px',
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    maxHeight: '100px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    paddingRight: '4px',
  } as React.CSSProperties,

  contentScrollbar: {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: '#ccc #f5f5f5',
  } as React.CSSProperties,

  errorMessage: {
    color: '#d32f2f',
    fontSize: '12px',
    marginTop: '8px',
    fontStyle: 'italic',
  } as React.CSSProperties,

  loadingIndicator: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  } as React.CSSProperties,
};

/**
 * StoryNode component - renders a single node in the story tree.
 *
 * This component is wrapped with React.memo() for performance optimization
 * in React Flow, which re-renders frequently during panning/zooming.
 *
 * @param props - Props containing data and selected state from React Flow
 */
const StoryNodeComponent = (props: StoryNodeProps) => {
  const { data, selected } = props;

    // LIBRARY PATTERN: Defensive programming
    // Always check if data exists before accessing properties
    if (!data) {
      return (
        <div
          style={{ ...styles.node, ...styles.nodeError }}
          data-testid="story-node"
          data-error="true"
        >
          <div style={styles.title}>Error</div>
          <div style={styles.errorMessage}>No data provided</div>
        </div>
      );
    }

    // Extract data with safe defaults
    const {
      storyNode,
      isLeaf = false,
      hasError = false,
      errorMessage,
      isLoading = false,
      className,
      onClick,
      theme,
      showNodeId = false,
    } = data;

    // LIBRARY PATTERN: Validate required nested data
    if (!storyNode) {
      return (
        <div
          style={{ ...styles.node, ...styles.nodeError }}
          data-testid="story-node"
          data-error="true"
        >
          <div style={styles.title}>Error</div>
          <div style={styles.errorMessage}>Invalid node data</div>
        </div>
      );
    }

    const { id, title, content, customId } = storyNode;

    // Build composite styles based on state with theme overrides
    let nodeStyle: React.CSSProperties = { ...styles.node };

    // Apply leaf/branch styling
    if (isLeaf) {
      nodeStyle = {
        ...nodeStyle,
        borderColor: theme?.leafBorderColor || '#4caf50',
        background: theme?.leafBackgroundColor || '#f1f8e9',
      };
    } else {
      nodeStyle = {
        ...nodeStyle,
        borderColor: theme?.branchBorderColor || '#b1b1b7',
        background: theme?.branchBackgroundColor || '#ffffff',
      };
    }

    // Apply selected styling
    if (selected) {
      nodeStyle = {
        ...nodeStyle,
        borderColor: theme?.selectedBorderColor || '#2196f3',
        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
      };
    }

    // Apply error/loading styles
    if (hasError) {
      nodeStyle = { ...nodeStyle, ...styles.nodeError };
    }
    if (isLoading) {
      nodeStyle = { ...nodeStyle, ...styles.nodeLoading };
    }

    // Handle node clicks
    const handleClick = () => {
      if (onClick && !isLoading && !hasError) {
        onClick(id);
      }
    };

    // ACCESSIBILITY: Build descriptive ARIA label
    const ariaLabel = `${title}${isLeaf ? ' (end of path)' : ''}${
      hasError ? ' (error)' : ''
    }${isLoading ? ' (loading)' : ''}`;

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        style={nodeStyle}
        className={className}
        onClick={handleClick}
        onKeyDown={(e) => {
          // ACCESSIBILITY: Support keyboard interaction
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        data-testid="story-node"
        data-leaf={String(isLeaf)}
        data-selected={String(selected)}
        data-error={String(hasError)}
        data-loading={String(isLoading)}
      >
        {/* React Flow Handles for connections */}
        {/* Target handle (receives incoming edges) - only show if not root */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: isLeaf ? '#4caf50' : '#2196f3',
            width: '10px',
            height: '10px',
          }}
        />

        {/* Node Content */}
        <div style={styles.title}>{title}</div>

        {showNodeId && customId && (
          <div style={{
            fontSize: '10px',
            color: '#999',
            marginTop: '-4px',
            marginBottom: '8px',
            fontFamily: 'monospace'
          }}>
            {customId}
          </div>
        )}

        {content && (
          <div
            className="nowheel"
            style={{ ...styles.content, ...styles.contentScrollbar }}
          >
            {content}
          </div>
        )}

        {/* Error State */}
        {hasError && errorMessage && (
          <div style={styles.errorMessage}>{errorMessage}</div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={styles.loadingIndicator}>Loading...</div>
        )}

        {/* Source handle (emits outgoing edges) - only show if not leaf */}
        {!isLeaf && (
          <Handle
            type="source"
            position={Position.Bottom}
            style={{
              background: '#2196f3',
              width: '10px',
              height: '10px',
            }}
          />
        )}
      </div>
    );
};

// Export the memoized component
export const StoryNode = React.memo(StoryNodeComponent);

// LIBRARY PATTERN: Set display name for React DevTools
StoryNode.displayName = 'StoryNode';

/**
 * TEACHING NOTE: Why React.memo()?
 *
 * React Flow re-renders frequently during interactions (panning, zooming).
 * React.memo() prevents unnecessary re-renders when props haven't changed.
 *
 * This is especially important for library components where consumers
 * might have large trees (100+ nodes). Memoization can significantly
 * improve performance.
 *
 * React Flow's documentation recommends wrapping custom nodes with memo().
 */

/**
 * TEACHING NOTE: Why inline styles instead of CSS classes?
 *
 * In a library, we use inline styles for core functionality to:
 * 1. Avoid CSS class name collisions with consumer's styles
 * 2. Ensure component works out-of-the-box without importing CSS files
 * 3. Make styles easily overridable via props
 *
 * Consumers can still customize via:
 * - className prop (add their own CSS)
 * - Theme system (future enhancement)
 * - Wrapper components
 */

/**
 * TEACHING NOTE: Data attributes for testing
 *
 * We use data-* attributes (data-testid, data-leaf, etc.) for:
 * 1. Testing: Easy to query in tests without depending on class names
 * 2. Debugging: Inspect state in browser DevTools
 * 3. Styling: Consumers can target these in their CSS
 *
 * This is a common pattern in component libraries.
 */
