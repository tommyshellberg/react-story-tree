/**
 * @file Langsmith configuration for story analysis evaluation
 * @description Configuration and utilities for evaluating prompt quality with Langsmith
 */

import { Client } from 'langsmith';

/**
 * Initialize Langsmith client with API key from environment
 *
 * Required environment variables:
 * - LANGSMITH_API_KEY: Your Langsmith API key
 * - LANGSMITH_PROJECT: Project name (defaults to 'react-story-tree-eval')
 */
export function initLangsmithClient(): Client {
  const apiKey = process.env.LANGSMITH_API_KEY;

  if (!apiKey) {
    throw new Error(
      'LANGSMITH_API_KEY environment variable is required. ' +
        'Create a .env.evaluation file with your Langsmith API key.'
    );
  }

  const client = new Client({
    apiKey,
  });

  return client;
}

/**
 * Get the Langsmith project name from environment or use default
 */
export function getProjectName(): string {
  return process.env.LANGSMITH_PROJECT || 'react-story-tree-eval';
}

/**
 * Evaluation configuration
 */
export interface EvalConfig {
  /** Langsmith project name */
  project: string;

  /** LLM model to use for evaluation */
  model: string;

  /** Dataset name to evaluate against */
  datasetName: string;

  /** Number of concurrent evaluations */
  concurrency?: number;
}

/**
 * Default evaluation configuration
 */
export const defaultEvalConfig: EvalConfig = {
  project: getProjectName(),
  model: 'gpt-5-mini',
  datasetName: 'story-analysis-test-suite',
  concurrency: 5,
};
