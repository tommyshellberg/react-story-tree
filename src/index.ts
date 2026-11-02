/**
 * react-story-tree - A React library for building and analyzing branching narrative systems
 * @module react-story-tree
 */

// Export all types
export * from './types';

// Export React components
import { StoryNode as StoryNodeComponent } from './components';
import type { StoryNode as StoryNodeData } from './types';

/**
 * `StoryNode` is both the node component (a value) and the node data type.
 * Declaring them separately keeps both usable from the package root:
 * `import { StoryNode }` for the component, `import type { StoryNode }` for the data.
 */
export const StoryNode = StoryNodeComponent;
export type StoryNode = StoryNodeData;
export { StoryTree } from './components';
export type { StoryTreeProps } from './components';

// Utility functions
export { traverseTree, concatenatePath, buildPathFromNodes, buildFlowStructure, applyLayout } from './utils';
export type { FlowStructure } from './utils';

// Analysis functions (LLM-powered story critique)
export { analyzeStory, analyzeStoryPath, buildAnalysisPrompt, parseAnalysisResponse } from './analysis';
