/**
 * @file Tests for story analysis engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeStoryPath,
  analyzeStory,
  buildAnalysisPrompt,
  parseAnalysisResponse,
} from '../../src/analysis/analyzer';
import type {
  StoryNode,
  TreeStructure,
  StoryPath,
  AnalysisOptions,
  PathAnalysisResult,
  StoryAnalysisResult,
} from '../../src/types';

// Mock the Vercel AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

import { generateText } from 'ai';

describe('analyzer', () => {
  // Test data setup
  const mockNodes = new Map<string, StoryNode>([
    [
      'node-1',
      {
        id: 'node-1',
        customId: 'start',
        title: 'The Beginning',
        content: 'You find a magic sword in the forest.',
      },
    ],
    [
      'node-2',
      {
        id: 'node-2',
        customId: 'path-a',
        title: 'Take the Sword',
        content: 'You pick up the sword. It glows with power.',
        decisionText: 'Pick up the sword',
      },
    ],
    [
      'node-3',
      {
        id: 'node-3',
        customId: 'path-b',
        title: 'Leave it Behind',
        content: 'You walk away. Later, you regret not having a weapon.',
        decisionText: 'Leave it',
      },
    ],
    [
      'node-4',
      {
        id: 'node-4',
        customId: 'ending-a',
        title: 'Victory',
        content: 'Using the sword, you defeat the dragon.',
        decisionText: 'Fight the dragon',
      },
    ],
  ]);

  const mockStructure: TreeStructure = {
    'node-1': ['node-2', 'node-3'],
    'node-2': ['node-4'],
    'node-3': [],
    'node-4': [],
  };

  const mockPath: StoryPath = {
    nodeIds: ['node-1', 'node-2', 'node-4'],
    nodes: [
      mockNodes.get('node-1')!,
      mockNodes.get('node-2')!,
      mockNodes.get('node-4')!,
    ],
    decisions: ['Pick up the sword', 'Fight the dragon'],
  };

  const mockOptions: AnalysisOptions = {
    model: 'mock-model',
    rootNodeId: 'node-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildAnalysisPrompt', () => {
    it('should construct a prompt with story path content', () => {
      const prompt = buildAnalysisPrompt(mockPath, mockOptions);

      expect(prompt).toContain('The Beginning');
      expect(prompt).toContain('You find a magic sword');
      expect(prompt).toContain('Pick up the sword');
      expect(prompt).toContain('Victory');
    });

    it('should include node IDs in the prompt', () => {
      const prompt = buildAnalysisPrompt(mockPath, mockOptions);

      expect(prompt).toContain('node-1');
      expect(prompt).toContain('node-2');
      expect(prompt).toContain('node-4');
    });

    it('should include custom IDs if available', () => {
      const prompt = buildAnalysisPrompt(mockPath, mockOptions);

      expect(prompt).toContain('start');
      expect(prompt).toContain('path-a');
      expect(prompt).toContain('ending-a');
    });

    it('should include critique rules when specified', () => {
      const optionsWithRules: AnalysisOptions = {
        ...mockOptions,
        rules: {
          continuity: true,
          logic: true,
          character: false,
          temporal: false,
        },
      };

      const prompt = buildAnalysisPrompt(mockPath, optionsWithRules);

      expect(prompt).toContain('continuity');
      expect(prompt).toContain('logic');
      expect(prompt).not.toContain('character tracking');
    });

    it('should include custom instructions when provided', () => {
      const optionsWithCustom: AnalysisOptions = {
        ...mockOptions,
        customInstructions:
          'Focus on medieval fantasy accuracy and weapon details.',
      };

      const prompt = buildAnalysisPrompt(mockPath, optionsWithCustom);

      expect(prompt).toContain('medieval fantasy accuracy');
      expect(prompt).toContain('weapon details');
    });

    it('should request structured JSON output', () => {
      const prompt = buildAnalysisPrompt(mockPath, mockOptions);

      expect(prompt).toContain('JSON');
      expect(prompt).toContain('issues');
      expect(prompt).toContain('suggestions');
    });
  });

  describe('parseAnalysisResponse', () => {
    it('should parse a valid LLM JSON response', () => {
      const mockResponse = JSON.stringify({
        issues: [
          {
            severity: 'warning',
            type: 'continuity',
            nodeId: 'node-4',
            message: 'The sword was not mentioned in the fight scene',
            context: 'you defeat the dragon',
          },
        ],
        suggestions: [
          {
            message: 'Add more description of the sword during battle',
            nodeId: 'node-4',
            category: 'depth',
          },
        ],
      });

      const result = parseAnalysisResponse(mockResponse, mockPath);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]?.severity).toBe('warning');
      expect(result.issues[0]?.type).toBe('continuity');
      expect(result.suggestions).toHaveLength(1);
      expect(result.path).toEqual(mockPath);
    });

    it('should handle LLM responses with markdown code blocks', () => {
      const mockResponse = `Here's the analysis:
\`\`\`json
{
  "issues": [],
  "suggestions": [{"message": "Good story!", "category": "other"}]
}
\`\`\`
Hope this helps!`;

      const result = parseAnalysisResponse(mockResponse, mockPath);

      expect(result.suggestions).toHaveLength(1);
      expect(result.issues).toEqual([]);
    });

    it('should provide defaults for missing fields', () => {
      const mockResponse = JSON.stringify({});

      const result = parseAnalysisResponse(mockResponse, mockPath);

      expect(result.issues).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it('should throw error for invalid JSON', () => {
      const mockResponse = 'This is not JSON at all!';

      expect(() => parseAnalysisResponse(mockResponse, mockPath)).toThrow(
        'Failed to parse LLM response'
      );
    });

    it('should validate issue structure', () => {
      const mockResponse = JSON.stringify({
        issues: [
          {
            // Missing severity
            type: 'logic',
            nodeId: 'node-1',
            message: 'Test',
          },
        ],
        suggestions: [],
      });

      expect(() => parseAnalysisResponse(mockResponse, mockPath)).toThrow(
        'Invalid issue structure'
      );
    });
  });

  describe('analyzeStoryPath', () => {
    it('should analyze a single path with LLM', async () => {
      const mockLLMResponse = {
        text: JSON.stringify({
          issues: [
            {
              severity: 'info',
              type: 'other',
              nodeId: 'node-2',
              message: 'Consider adding more sensory details',
            },
          ],
          suggestions: [
            {
              message: 'Describe how the sword feels in hand',
              category: 'depth',
            },
          ],
        }),
      };

      (generateText as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockLLMResponse
      );

      const result = await analyzeStoryPath(mockPath, mockOptions);

      expect(result.path).toEqual(mockPath);
      expect(result.issues).toHaveLength(1);
      expect(result.suggestions).toHaveLength(1);
      expect(generateText).toHaveBeenCalledTimes(1);
    });

    it('should pass model and options to generateText', async () => {
      const mockLLMResponse = {
        text: JSON.stringify({
          issues: [],
          suggestions: [],
        }),
      };

      (generateText as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockLLMResponse
      );

      const customOptions: AnalysisOptions = {
        model: 'gpt-4-turbo',
        maxTokens: 2000,
      };

      await analyzeStoryPath(mockPath, customOptions);

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo',
          maxTokens: 2000,
        })
      );
    });

    it('should handle LLM errors gracefully', async () => {
      (generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(analyzeStoryPath(mockPath, mockOptions)).rejects.toThrow(
        'API rate limit exceeded'
      );
    });
  });

  describe('analyzeStory', () => {
    it('should analyze all paths in a story tree', async () => {
      const mockLLMResponse1 = {
        text: JSON.stringify({
          issues: [],
          suggestions: [{ message: 'Good path!', category: 'other' }],
        }),
      };

      const mockLLMResponse2 = {
        text: JSON.stringify({
          issues: [
            {
              severity: 'warning',
              type: 'logic',
              nodeId: 'node-3',
              message: 'No weapon makes dragon fight difficult',
            },
          ],
          suggestions: [],
        }),
      };

      (generateText as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockLLMResponse1)
        .mockResolvedValueOnce(mockLLMResponse2);

      const result = await analyzeStory(mockNodes, mockStructure, mockOptions);

      // Should analyze 2 paths: node-1 → node-2 → node-4, and node-1 → node-3
      expect(result.pathResults).toHaveLength(2);
      expect(result.allSuggestions).toHaveLength(1);
      expect(result.allIssues).toHaveLength(1);
      expect(generateText).toHaveBeenCalledTimes(2);
    });

    it('should calculate correct statistics', async () => {
      const mockLLMResponse = {
        text: JSON.stringify({ issues: [], suggestions: [] }),
      };

      (generateText as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockLLMResponse
      );

      const result = await analyzeStory(mockNodes, mockStructure, mockOptions);

      expect(result.statistics.totalNodes).toBe(4);
      expect(result.statistics.totalPaths).toBe(2);
      expect(result.statistics.leafNodes).toBe(2);
      expect(result.statistics.minPathLength).toBe(2); // node-1 → node-3
      expect(result.statistics.maxPathLength).toBe(3); // node-1 → node-2 → node-4
      expect(result.statistics.averagePathLength).toBe(2.5); // (3 + 2) / 2
    });

    it('should deduplicate issues and suggestions', async () => {
      const duplicateIssue = {
        severity: 'warning' as const,
        type: 'continuity' as const,
        nodeId: 'node-1',
        message: 'Same issue in both paths',
      };

      (generateText as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          text: JSON.stringify({
            issues: [duplicateIssue],
            suggestions: [],
          }),
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({
            issues: [duplicateIssue],
            suggestions: [],
          }),
        });

      const result = await analyzeStory(mockNodes, mockStructure, mockOptions);

      // Should only have 1 unique issue, not 2 duplicates
      expect(result.allIssues).toHaveLength(1);
    });

    it('should throw error if root node not found', async () => {
      const badOptions: AnalysisOptions = {
        model: 'mock-model',
        rootNodeId: 'nonexistent-node',
      };

      await expect(
        analyzeStory(mockNodes, mockStructure, badOptions)
      ).rejects.toThrow('Root node');
    });

    it('should find root automatically if not specified', async () => {
      const mockLLMResponse = {
        text: JSON.stringify({ issues: [], suggestions: [] }),
      };

      (generateText as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockLLMResponse
      );

      const optionsWithoutRoot: AnalysisOptions = {
        model: 'mock-model',
      };

      const result = await analyzeStory(
        mockNodes,
        mockStructure,
        optionsWithoutRoot
      );

      expect(result.pathResults.length).toBeGreaterThan(0);
    });
  });
});
