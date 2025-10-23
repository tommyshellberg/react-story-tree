import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryNode } from '../../src/components/StoryNode';
import type { NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../../src/types';

/**
 * Test suite for StoryNode component
 *
 * StoryNode is a custom React Flow node that displays story content.
 * It needs to:
 * - Render node content (title, description)
 * - Apply different styling for leaf vs branch nodes
 * - Handle click events
 * - Support theming/customization
 * - Handle edge cases gracefully
 */

describe('StoryNode Component', () => {
  // Helper to create mock NodeProps for React Flow
  const createMockNodeProps = (
    overrides: Partial<NodeProps<FlowNodeData>> = {}
  ): NodeProps<FlowNodeData> => ({
    id: 'node-1',
    data: {
      storyNode: {
        id: 'node-1',
        title: 'Test Node',
        content: 'Test content',
      },
      isLeaf: false,
    },
    selected: false,
    type: 'storyNode',
    dragging: false,
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    ...overrides,
  });

  describe('Basic Rendering', () => {
    it('should render node with title and content', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Chapter 1',
            content: 'The story begins',
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('The story begins')).toBeInTheDocument();
    });

    it('should render node with only title (minimal StoryNode)', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Chapter 1',
            content: '', // content is required, but can be empty
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    });

    it('should render node with empty content', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Chapter 1',
            content: '',
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      // Empty content should not cause errors
    });

    it('should truncate very long titles gracefully', () => {
      const longTitle = 'A'.repeat(200);
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: longTitle,
            content: 'Content text',
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toBeInTheDocument();
      // Component should handle long text without breaking layout
    });
  });

  describe('Leaf vs Branch Styling', () => {
    it('should apply leaf node styling when isLeaf is true', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'leaf-node',
            title: 'The End',
            content: 'Final chapter',
          },
          isLeaf: true,
        },
      });

      const { container } = render(<StoryNode {...props} />);

      // Leaf nodes should have distinct styling (check via data attribute or class)
      const nodeElement = container.querySelector('[data-leaf="true"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should apply branch node styling when isLeaf is false', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'branch-node',
            title: 'Chapter 1',
            content: 'Story continues',
          },
          isLeaf: false,
        },
      });

      const { container } = render(<StoryNode {...props} />);

      // Branch nodes should have standard styling
      const nodeElement = container.querySelector('[data-leaf="false"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should handle undefined isLeaf by defaulting to false', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Chapter 1',
            content: 'Content',
          },
          isLeaf: undefined as any, // Simulate missing property
        },
      });

      const { container } = render(<StoryNode {...props} />);

      // Should default to branch node (isLeaf = false)
      const nodeElement = container.querySelector('[data-leaf="false"]');
      expect(nodeElement).toBeInTheDocument();
    });
  });

  describe('Selected State', () => {
    it('should apply selected styling when selected prop is true', () => {
      const props = createMockNodeProps({
        selected: true,
      });

      const { container } = render(<StoryNode {...props} />);

      // Selected nodes should have visual indicator
      const nodeElement = container.querySelector('[data-selected="true"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should not apply selected styling when selected prop is false', () => {
      const props = createMockNodeProps({
        selected: false,
      });

      const { container } = render(<StoryNode {...props} />);

      const nodeElement = container.querySelector('[data-selected="false"]');
      expect(nodeElement).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onClick callback when node is clicked', () => {
      const handleClick = vi.fn();
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Clickable Node',
            content: 'Click me',
          },
          isLeaf: false,
          onClick: handleClick,
        },
      });

      render(<StoryNode {...props} />);

      const nodeElement = screen.getByText('Clickable Node').closest('[data-testid="story-node"]');
      expect(nodeElement).toBeInTheDocument();

      fireEvent.click(nodeElement!);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith('node-1');
    });

    it('should not crash when onClick is undefined', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Node without handler',
            content: 'Content',
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      const nodeElement = screen.getByText('Node without handler').closest('[data-testid="story-node"]');

      // Should not throw error when clicked without handler
      expect(() => fireEvent.click(nodeElement!)).not.toThrow();
    });
  });

  describe('Error and Loading States', () => {
    it('should display error state when hasError is true', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Error Node',
            content: 'Content',
          },
          isLeaf: false,
          hasError: true,
          errorMessage: 'Failed to load data',
        },
      });

      const { container } = render(<StoryNode {...props} />);

      const nodeElement = container.querySelector('[data-error="true"]');
      expect(nodeElement).toBeInTheDocument();
      expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
    });

    it('should display loading state when isLoading is true', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Loading Node',
            content: 'Content',
          },
          isLeaf: false,
          isLoading: true,
        },
      });

      const { container } = render(<StoryNode {...props} />);

      const nodeElement = container.querySelector('[data-loading="true"]');
      expect(nodeElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Accessible Node',
            content: 'Content text',
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      // Should use semantic HTML elements
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should include node title in accessible name', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'story-node-42',
            title: 'Chapter 42',
            content: 'Story content',
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName(/Chapter 42/i);
    });

    it('should indicate leaf nodes to screen readers', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'ending-1',
            title: 'Happy Ending',
            content: 'The story ends',
          },
          isLeaf: true,
        },
      });

      render(<StoryNode {...props} />);

      // Leaf nodes should have ARIA label indicating they're end points
      expect(screen.getByRole('button')).toHaveAttribute('aria-label');
    });
  });

  describe('Edge Cases', () => {
    it('should handle node with very long content', () => {
      const longContent = 'X'.repeat(1000);
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Node',
            content: longContent,
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle special characters in title and content', () => {
      const props = createMockNodeProps({
        data: {
          storyNode: {
            id: 'node-1',
            title: 'Title with <html> & "quotes"',
            content: 'Content with \nnewlines\t and \ttabs',
          },
          isLeaf: false,
        },
      });

      render(<StoryNode {...props} />);

      expect(screen.getByText('Title with <html> & "quotes"')).toBeInTheDocument();
    });

    it('should handle missing data object gracefully', () => {
      const props = createMockNodeProps({
        data: undefined as any,
      });

      // Should not crash, but render error state or empty node
      expect(() => render(<StoryNode {...props} />)).not.toThrow();
    });
  });
});
