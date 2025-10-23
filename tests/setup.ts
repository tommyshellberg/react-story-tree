import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// This file runs before each test file
// It sets up testing-library/jest-dom matchers like toBeInTheDocument()

// Mock ResizeObserver for React Flow
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock React Flow components
// React Flow components like Handle require a provider context
// For unit testing, we mock them to avoid setup complexity
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    // Mock Handle component - just render a div with data attributes for testing
    Handle: ({ type, position, style, ...props }: any) => {
      return React.createElement('div', {
        'data-testid': `handle-${type}`,
        'data-handletype': type,
        'data-handlepos': position,
        style,
        ...props,
      });
    },
    // Export Position enum for components to use
    Position: {
      Top: 'top',
      Bottom: 'bottom',
      Left: 'left',
      Right: 'right',
    },
  };
});
