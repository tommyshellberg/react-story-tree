/**
 * Types for LLM-powered story analysis and critique.
 * @module types/analysis
 */

import type { StoryPath } from './story';

/**
 * Severity levels for analysis issues.
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Categories of issues that can be detected in story analysis.
 */
export type IssueType =
  | 'continuity'        // Inconsistent details, objects appearing/disappearing
  | 'logic'             // Impossible actions, contradictory outcomes
  | 'character'         // Character state issues (e.g., appearing after death)
  | 'temporal'          // Time-related inconsistencies
  | 'other';            // Uncategorized issues

/**
 * Represents a single issue found during story analysis.
 *
 * @example
 * ```typescript
 * const issue: AnalysisIssue = {
 *   severity: 'error',
 *   type: 'character',
 *   nodeId: 'node-5',
 *   message: 'Character "Marcus" appears in this scene but died in node-3',
 *   context: 'Marcus enters the room and greets you.'
 * };
 * ```
 */
export interface AnalysisIssue {
  /** How severe is this issue */
  severity: IssueSeverity;

  /** Category of the issue */
  type: IssueType;

  /** ID of the node where the issue was found */
  nodeId: string;

  /** Human-readable description of the issue */
  message: string;

  /**
   * Optional excerpt from the story content showing the problematic section.
   * Helps users quickly identify the issue location.
   */
  context?: string;
}

/**
 * Suggestions for improving the story.
 */
export interface Suggestion {
  /** The suggestion text */
  message: string;

  /** Optional node ID this suggestion applies to */
  nodeId?: string;

  /** Optional category for grouping suggestions */
  category?: 'pacing' | 'depth' | 'clarity' | 'engagement' | 'other';
}

/**
 * Result from analyzing a single story path.
 * The LLM analyzes one path at a time (root to leaf).
 */
export interface PathAnalysisResult {
  /** The story path that was analyzed */
  path: StoryPath;

  /** Issues found in this specific path */
  issues: AnalysisIssue[];

  /** Suggestions for this specific path */
  suggestions: Suggestion[];
}

/**
 * Complete result from analyzing an entire story tree.
 * Aggregates results from analyzing all paths.
 *
 * @example
 * ```typescript
 * const result: StoryAnalysisResult = {
 *   pathResults: [...],
 *   allIssues: [...],
 *   allSuggestions: [...],
 *   statistics: {
 *     totalNodes: 25,
 *     totalPaths: 8,
 *     averagePathLength: 6.5,
 *     leafNodes: 8
 *   }
 * };
 * ```
 */
export interface StoryAnalysisResult {
  /** Results from analyzing each individual path */
  pathResults: PathAnalysisResult[];

  /** All issues from all paths combined */
  allIssues: AnalysisIssue[];

  /** All suggestions from all paths combined */
  allSuggestions: Suggestion[];

  /** Statistical information about the story tree */
  statistics: {
    /** Total number of nodes in the tree */
    totalNodes: number;

    /** Total number of unique paths from root to leaves */
    totalPaths: number;

    /** Average length of paths (number of nodes) */
    averagePathLength: number;

    /** Number of leaf nodes */
    leafNodes: number;

    /** Longest path length */
    maxPathLength: number;

    /** Shortest path length */
    minPathLength: number;
  };
}

/**
 * Supported LLM providers for story analysis.
 * - 'anthropic': Claude models from Anthropic
 * - 'openai': GPT models from OpenAI
 */
export type LLMProvider = 'anthropic' | 'openai';

/**
 * Configuration options for story analysis.
 *
 * This API is designed to be simple and user-friendly - consumers just provide
 * their API key and model name, without needing to know about the underlying
 * AI SDK implementation.
 *
 * @example
 * ```typescript
 * const result = await analyzeStoryPath(path, {
 *   provider: 'anthropic',
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   modelName: 'claude-3-5-sonnet-20241022', // optional, this is the default
 * });
 * ```
 */
export interface AnalysisOptions {
	/**
	 * LLM provider to use for analysis.
	 * Supported providers: 'anthropic' | 'openai'
	 */
	provider: LLMProvider;

	/**
	 * API key for the LLM provider.
	 * - For Anthropic, get your key from: https://console.anthropic.com/
	 * - For OpenAI, get your key from: https://platform.openai.com/api-keys
	 */
	apiKey: string;

	/**
	 * Model name to use for analysis.
	 *
	 * **Anthropic models** (defaults to 'claude-3-5-sonnet-20241022'):
	 * - 'claude-3-5-sonnet-20241022' (best balance)
	 * - 'claude-3-5-haiku-20241022' (faster, cheaper)
	 * - 'claude-3-opus-20240229' (most capable, slower)
	 *
	 * **OpenAI models** (defaults to 'gpt-5-mini'):
	 * - 'gpt-5-mini' (latest, fast and capable)
	 * - 'gpt-4o' (multimodal)
	 * - 'gpt-4o-mini' (faster, cheaper)
	 */
	modelName?: string;

	/**
	 * Starting node ID for analysis.
	 * If not provided, the library will attempt to find the root node.
	 */
	rootNodeId?: string;

	/**
	 * Which critique rules to apply.
	 * If not specified, all default rules are applied.
	 */
	rules?: {
		continuity?: boolean;
		logic?: boolean;
		character?: boolean;
		temporal?: boolean;
	};

	/**
	 * Custom instructions to add to the analysis prompt.
	 * Useful for domain-specific requirements.
	 */
	customInstructions?: string;

	/**
	 * Maximum number of tokens for the LLM response.
	 */
	maxTokens?: number;
}
