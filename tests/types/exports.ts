import type { StoryNode as StoryNodeData } from '../../src';
import { StoryNode } from '../../src';

export const nodeData: StoryNodeData = { id: 'a', title: 'A', content: '' };
export const nodeComponent: typeof StoryNode = StoryNode;
