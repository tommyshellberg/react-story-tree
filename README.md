# react-story-tree

[![CI](https://github.com/tommyshellberg/react-story-tree/workflows/CI/badge.svg)](https://github.com/tommyshellberg/react-story-tree/actions)
[![codecov](https://codecov.io/gh/tommyshellberg/react-story-tree/branch/main/graph/badge.svg)](https://codecov.io/gh/tommyshellberg/react-story-tree)
[![npm version](https://badge.fury.io/js/react-story-tree.svg)](https://www.npmjs.com/package/react-story-tree)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A React library for building and analyzing branching narrative story systems with interactive tree visualization and AI-powered quality analysis.

## Features

- 📊 **Interactive Tree Visualization** - Built on React Flow for smooth, interactive story tree diagrams
- 🤖 **LLM-Powered Story Analysis** - AI-driven critique of narrative logic, continuity, and coherence (Anthropic & OpenAI)
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
pnpm add react react-dom @emotion/react @emotion/styled
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

## LLM-Powered Story Analysis

Analyze your branching narratives for logical consistency, continuity errors, and narrative quality using AI models from Anthropic (Claude) or OpenAI (GPT).

### Why Use Story Analysis?

- **Catch Continuity Errors**: Detect when objects disappear, characters appear after dying, or facts contradict
- **Find Logic Issues**: Identify impossible outcomes or contradictory story developments
- **Improve Quality**: Get suggestions for pacing, depth, clarity, and engagement
- **Save Time**: Automatically analyze all story paths instead of manually testing each branch

### Quick Start: Analyze a Story Path

```tsx
import { analyzeStoryPath, traverseTree } from 'react-story-tree';
import type { StoryNode, TreeStructure } from 'react-story-tree';

// Your story data
const nodes = new Map<string, StoryNode>([...]);
const structure: TreeStructure = {...};

// Get all paths through your story
const paths = traverseTree(nodes, structure, 'start');

// Analyze a specific path with Anthropic (Claude)
const result = await analyzeStoryPath(paths[0], {
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  rules: {
    continuity: true,  // Check for disappearing objects/facts
    logic: true,       // Check for contradictions
    character: true,   // Check character consistency
    temporal: true,    // Check time progression
  }
});

console.log(`Found ${result.issues.length} issues`);
console.log(`Got ${result.suggestions.length} suggestions`);
```

### Using OpenAI (GPT)

```tsx
const result = await analyzeStoryPath(paths[0], {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  modelName: 'gpt-5-mini', // Optional, this is the default
  rules: {
    continuity: true,
    logic: true,
  }
});
```

### Analyzing the Entire Story Tree

⚠️ **Warning**: This makes one API call per path, which can be expensive for large trees.

```tsx
import { analyzeStory } from 'react-story-tree';

// Analyze all paths in the tree
const result = await analyzeStory(nodes, structure, {
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

console.log(`Analyzed ${result.statistics.totalPaths} paths`);
console.log(`Found ${result.allIssues.length} unique issues across all paths`);
console.log(`Tree has ${result.statistics.totalNodes} nodes`);
console.log(`Average path length: ${result.statistics.averagePathLength.toFixed(1)} nodes`);

// Issues are deduplicated across paths
result.allIssues.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.type} in node ${issue.nodeId}:`);
  console.log(`  ${issue.message}`);
});
```

### Understanding Analysis Results

#### Issue Types

- **`continuity`**: Objects/facts disappear or contradict (e.g., "You picked up the sword" → "you have no weapon")
- **`logic`**: Impossible outcomes (e.g., "The wizard dies" → "the wizard thanks you")
- **`character`**: Character inconsistencies (e.g., appearing after death, contradicting own statements)
- **`temporal`**: Time progression errors (e.g., "It is 6 PM" → "noon meeting" without explanation)

#### Severity Levels

- **`error`**: Clear problems that break the story
- **`warning`**: Potential issues that should be reviewed
- **`info`**: Minor observations or suggestions

#### Example Result

```tsx
{
  path: StoryPath,
  issues: [
    {
      severity: 'error',
      type: 'character',
      nodeId: 'node-5',
      message: 'Character "Marcus" appears but died in node-3',
      context: 'Marcus enters the room and greets you.'
    }
  ],
  suggestions: [
    {
      message: 'Add more sensory details to make the scene vivid',
      nodeId: 'node-2',
      category: 'depth'
    }
  ]
}
```

### Configuration Options

```tsx
interface AnalysisOptions {
  // LLM Provider (required)
  provider: 'anthropic' | 'openai';
  apiKey: string;

  // Model selection (optional)
  modelName?: string;  // Defaults: claude-3-5-sonnet-20241022 or gpt-5-mini

  // Analysis rules (optional - all default to true)
  rules?: {
    continuity?: boolean;  // Check for disappearing objects/facts
    logic?: boolean;       // Check for contradictions
    character?: boolean;   // Check character consistency
    temporal?: boolean;    // Check time progression
  };

  // Custom analysis instructions (optional)
  customInstructions?: string;

  // Token limit for LLM response (optional)
  maxTokens?: number;

  // Root node for tree analysis (optional - auto-detected if omitted)
  rootNodeId?: string;
}
```

### Supported Models

#### Anthropic (Claude)
- `claude-3-5-sonnet-20241022` (default) - Best balance of quality and speed
- `claude-3-5-haiku-20241022` - Faster, more economical
- `claude-3-opus-20240229` - Most capable, slower

#### OpenAI (GPT)
- `gpt-5-mini` (default) - Latest, fast and capable
- `gpt-4o` - Multimodal support
- `gpt-4o-mini` - Faster, more economical

### Best Practices

1. **Analyze During Development**: Run analysis as you write to catch issues early
2. **User-Selected Paths**: For interactive tools, analyze specific paths users select
3. **Batch Analysis Sparingly**: `analyzeStory()` is expensive - use for final reports
4. **Handle Partial Failures**: The library continues on errors, providing partial results
5. **Custom Instructions**: Add domain-specific requirements with `customInstructions`

### Error Handling

The library provides robust error handling:

```tsx
try {
  const result = await analyzeStoryPath(path, {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
} catch (error) {
  // Error includes helpful context:
  // - Which path failed
  // - What provider/model was used
  // - Suggestions for fixing (check API key, network, etc.)
  console.error(error.message);
}
```

**Partial success** in batch operations:
```tsx
// If analyzing 10 paths and path #7 fails, you still get results for the other 9
const result = await analyzeStory(nodes, structure, options);
// result.pathResults contains successful analyses
// Failed paths are logged to console.error
```

### Troubleshooting

**"API key is required"**
- Ensure your API key is not empty or whitespace-only
- For Anthropic: Get key from https://console.anthropic.com/
- For OpenAI: Get key from https://platform.openai.com/api-keys

**"Failed to parse LLM response as JSON"**
- The LLM didn't follow the JSON format instructions
- Try a different model (e.g., switch from haiku to sonnet)
- Check if `customInstructions` are conflicting with format requirements

**"Rate limit exceeded"**
- You've hit the API provider's rate limit
- Wait and retry, or upgrade your API plan
- For batch operations, consider adding delays between requests

**"Model not found"**
- Check the model name spelling
- Ensure the model is available in your API plan
- Try using the default model by omitting `modelName`

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

Extract and navigate story paths programmatically:

```tsx
import { traverseTree, concatenatePath } from 'react-story-tree';

// Get all possible story paths from root to leaves
const paths = traverseTree(nodes, structure, 'start');

console.log(`Found ${paths.length} different story paths`);

// Each path contains:
paths[0].nodeIds;    // ['start', 'choice-a', 'ending-1']
paths[0].nodes;      // [StoryNode, StoryNode, StoryNode]
paths[0].decisions;  // ['Take the left path', 'Enter the cave']

// Concatenate a path into a single narrative
const fullStory = concatenatePath(paths[0]);
console.log(fullStory); // "Your adventure starts... You chose left... You enter the cave..."
```

### Use Cases

- **Testing**: Verify all paths lead to valid endings
- **Analytics**: Calculate average path length, identify orphaned nodes
- **Content Generation**: Export paths as linear stories for non-interactive formats
- **LLM Analysis**: Feed paths to `analyzeStoryPath()` for quality checking

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
- [Vercel AI SDK](https://sdk.vercel.ai/) - Unified interface for LLM providers
- [Anthropic](https://www.anthropic.com/) - Claude AI models
- [OpenAI](https://openai.com/) - GPT models
- [Vitest](https://vitest.dev/) - Fast unit test framework
