# react-story-tree

[![CI](https://github.com/tommyshellberg/react-story-tree/workflows/CI/badge.svg)](https://github.com/tommyshellberg/react-story-tree/actions)
[![codecov](https://codecov.io/gh/tommyshellberg/react-story-tree/branch/main/graph/badge.svg)](https://codecov.io/gh/tommyshellberg/react-story-tree)
[![npm version](https://badge.fury.io/js/react-story-tree.svg)](https://www.npmjs.com/package/react-story-tree)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A React library for building and analyzing branching narrative quest systems with interactive tree visualization.

## Features

- 📊 **Interactive Tree Visualization** - Built on React Flow for smooth, interactive story tree diagrams
- 🎨 **Customizable Theming** - Flexible styling options for nodes, edges, and layout
- 🔍 **Tree Traversal Utilities** - Tools for navigating and analyzing story paths
- 🧪 **Well-Tested** - 94%+ test coverage with comprehensive edge case handling
- 📦 **TypeScript First** - Full type safety with exported TypeScript definitions
- 🎯 **Zero Config** - Works out of the box with sensible defaults

## Installation

```bash
# npm
npm install react-story-tree

# pnpm
pnpm add react-story-tree

# yarn
yarn add react-story-tree
```

### Peer Dependencies

This library requires the following peer dependencies:

```bash
pnpm add react react-dom @mui/material @emotion/react @emotion/styled
```

## Quick Start

```tsx
import { StoryTree } from 'react-story-tree';
import type { StoryNode, TreeStructure } from 'react-story-tree';

// Define your story nodes
const nodes = new Map<string, StoryNode>([
  ['start', {
    id: 'start',
    title: 'The Beginning',
    content: 'Your adventure starts here...'
  }],
  ['choice-a', {
    id: 'choice-a',
    title: 'Path A',
    content: 'You chose the left path.'
  }],
  ['choice-b', {
    id: 'choice-b',
    title: 'Path B',
    content: 'You chose the right path.'
  }],
]);

// Define the tree structure (parent -> children)
const structure: TreeStructure = {
  'start': ['choice-a', 'choice-b'],
  'choice-a': [],
  'choice-b': [],
};

// Render the tree
function App() {
  return (
    <div style={{ height: '600px' }}>
      <StoryTree
        nodes={nodes}
        structure={structure}
        rootId="start"
      />
    </div>
  );
}
```

## API Reference

### `<StoryTree>`

Main component for rendering interactive story trees.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `Map<string, StoryNode>` | **required** | Map of node IDs to story node data |
| `structure` | `TreeStructure` | **required** | Tree structure defining parent-child relationships |
| `rootId` | `string` | **required** | ID of the root node to start traversal from |
| `layoutOptions` | `LayoutOptions` | `{}` | Layout configuration (direction, spacing) |
| `theme` | `VisualizationTheme` | `{}` | Theme/styling options |
| `showNodeId` | `boolean` | `false` | Whether to show node IDs (customId) |
| `onNodeClick` | `(nodeId: string) => void` | `undefined` | Called when a node is clicked |
| `onEdgeClick` | `(edgeId: string) => void` | `undefined` | Called when an edge is clicked |
| `showBackground` | `boolean` | `true` | Show background grid |
| `showControls` | `boolean` | `true` | Show zoom/pan controls |
| `showMiniMap` | `boolean` | `true` | Show minimap |
| `className` | `string` | `undefined` | Custom CSS class for the container |
| `style` | `React.CSSProperties` | `undefined` | Custom inline styles for the container |

### Theme Customization

```tsx
<StoryTree
  nodes={nodes}
  structure={structure}
  rootId="start"
  theme={{
    leafBorderColor: '#f44336',
    leafBackgroundColor: '#ffebee',
    branchBorderColor: '#2196f3',
    branchBackgroundColor: '#e3f2fd',
    selectedBorderColor: '#ff9800',
  }}
/>
```

### Layout Options

```tsx
<StoryTree
  nodes={nodes}
  structure={structure}
  rootId="start"
  layoutOptions={{
    direction: 'TB',      // 'TB' | 'BT' | 'LR' | 'RL'
    nodeSpacing: 80,      // Horizontal spacing between nodes
    rankSpacing: 120,     // Vertical spacing between ranks/levels
  }}
/>
```

## Utility Functions

### Tree Traversal

```tsx
import {
  traverseQuestTree,
  findAllPaths,
  findShortestPath
} from 'react-story-tree';

// Get all possible story paths
const paths = traverseQuestTree(nodes, structure, 'start');

// Find all paths from start to a specific ending
const allPaths = findAllPaths(structure, 'start', 'ending-1');

// Find shortest path between two nodes
const shortestPath = findShortestPath(structure, 'start', 'ending-1');
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`pnpm test`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT © [Thomas Shellberg](https://github.com/tommyshellberg)

## Acknowledgments

Built with:
- [React Flow](https://reactflow.dev/) - Powerful library for building node-based editors
- [Dagre](https://github.com/dagrejs/dagre) - Graph layout algorithm
- [Vitest](https://vitest.dev/) - Fast unit test framework
