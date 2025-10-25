/**
 * @file Story analysis engine powered by LLM
 * @module analysis/analyzer
 */

import { generateText } from 'ai';
import { traverseTree, concatenatePath } from '../utils/traversal';
import type {
  StoryNode,
  TreeStructure,
  StoryPath,
  AnalysisOptions,
  PathAnalysisResult,
  StoryAnalysisResult,
  AnalysisIssue,
  Suggestion,
} from '../types';

/**
 * Builds the LLM prompt for analyzing a story path.
 *
 * The prompt includes:
 * - The complete narrative with node IDs
 * - Instructions for what to analyze (continuity, logic, etc.)
 * - Request for structured JSON output
 * - Custom instructions if provided
 *
 * @param path - The story path to analyze
 * @param options - Analysis configuration
 * @returns Formatted prompt string for the LLM
 */
export function buildAnalysisPrompt(
  path: StoryPath,
  options: AnalysisOptions
): string {
  const narrative = concatenatePath(path);

  const enabledRules = options.rules || {
    continuity: true,
    logic: true,
    character: true,
    temporal: true,
  };

  const ruleInstructions: string[] = [];

  if (enabledRules.continuity) {
    ruleInstructions.push(
      '- **Continuity**: Flag ONLY when objects/facts explicitly disappear or contradict earlier statements. Example: "You picked up the sword" then "you have no weapon" without explanation.'
    );
  }

  if (enabledRules.logic) {
    ruleInstructions.push(
      '- **Logic**: Flag ONLY clear contradictions or impossible outcomes. Example: "The wizard dies" then "the wizard thanks you" in the next node.'
    );
  }

  if (enabledRules.character) {
    ruleInstructions.push(
      '- **Character**: Flag ONLY when a character directly contradicts their own statements or appears after explicitly dying. Example: "I come from the north" then "I\'ve never been to the north."'
    );
  }

  if (enabledRules.temporal) {
    ruleInstructions.push(
      '- **Temporal**: Flag ONLY impossible time progressions. Example: "It is 6 PM" then "You arrive for your noon meeting" without time travel explanation.'
    );
  }

  const rulesSection =
    ruleInstructions.length > 0
      ? `**IMPORTANT: Be conservative. Only flag CLEAR, OBVIOUS errors.**\n\nAnalyze these aspects:\n${ruleInstructions.join('\n')}`
      : 'Perform a general quality analysis.';

  const customSection = options.customInstructions
    ? `\n\nAdditional requirements:\n${options.customInstructions}`
    : '';

  const nodeIdMap = path.nodes
    .map(
      (node, idx) =>
        `- Node ${idx + 1}: ${node.id}${node.customId ? ` (${node.customId})` : ''}`
    )
    .join('\n');

  const prompt = `You are a narrative quality analyst for branching story paths. Your job is to find CLEAR ERRORS, not to critique writing style.

${rulesSection}${customSection}

**What to IGNORE (do NOT flag these):**
- Stylistic choices (brief descriptions, simple language)
- Missing details that could be explained later
- Vague timeframes ("hours later", "eventually")
- Incomplete character backstories
- Things that are ambiguous but not contradictory
- Minor plausibility issues (unless explicitly impossible)

**When in doubt, DO NOT flag it.** Only flag issues you are confident about.

**Story Path**:
${narrative}

**Node Reference Map** (use these exact IDs in your response):
${nodeIdMap}

**Output Format**:
Respond with a JSON object (and ONLY JSON, no markdown, no explanations) with this structure:
{
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "type": "continuity" | "logic" | "character" | "temporal" | "other",
      "nodeId": "exact node ID from the map above",
      "message": "clear description of the contradiction or error",
      "context": "optional quote showing the issue"
    }
  ],
  "suggestions": [
    {
      "message": "concrete improvement suggestion",
      "nodeId": "optional node ID",
      "category": "pacing" | "depth" | "clarity" | "engagement" | "other"
    }
  ]
}

Remember: Empty arrays are fine if there are no clear errors. Quality varies - not every story needs issues flagged.`;

  return prompt;
}

/**
 * Parses the LLM's JSON response into structured analysis results.
 *
 * Handles:
 * - JSON extraction from markdown code blocks
 * - Validation of required fields
 * - Providing defaults for optional fields
 * - Type checking of issue/suggestion structures
 *
 * @param responseText - Raw text response from the LLM
 * @param path - The path that was analyzed
 * @returns Parsed and validated analysis result
 * @throws {Error} If response is invalid JSON
 */
export function parseAnalysisResponse(
  responseText: string,
  path: StoryPath
): PathAnalysisResult {
  let jsonText = responseText.trim();

  // Extract JSON from markdown code blocks if present
  const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(
      `Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('LLM response is not a valid object');
  }

  const data = parsed as Record<string, unknown>;

  // Parse issues array
  const issues: AnalysisIssue[] = [];
  if (Array.isArray(data.issues)) {
    for (const issue of data.issues) {
      if (!issue || typeof issue !== 'object') {
        throw new Error('Invalid issue structure: not an object');
      }

      const issueObj = issue as Record<string, unknown>;

      // Validate required issue fields
      if (
        typeof issueObj.severity !== 'string' ||
        typeof issueObj.type !== 'string' ||
        typeof issueObj.nodeId !== 'string' ||
        typeof issueObj.message !== 'string'
      ) {
        throw new Error(
          'Invalid issue structure: missing required fields (severity, type, nodeId, message)'
        );
      }

      issues.push({
        severity: issueObj.severity as AnalysisIssue['severity'],
        type: issueObj.type as AnalysisIssue['type'],
        nodeId: issueObj.nodeId,
        message: issueObj.message,
        context:
          typeof issueObj.context === 'string' ? issueObj.context : undefined,
      });
    }
  }

  // Parse suggestions array
  const suggestions: Suggestion[] = [];
  if (Array.isArray(data.suggestions)) {
    for (const suggestion of data.suggestions) {
      if (!suggestion || typeof suggestion !== 'object') {
        continue; // Skip invalid suggestions
      }

      const suggestionObj = suggestion as Record<string, unknown>;

      if (typeof suggestionObj.message !== 'string') {
        continue; // Skip suggestions without message
      }

      suggestions.push({
        message: suggestionObj.message,
        nodeId:
          typeof suggestionObj.nodeId === 'string'
            ? suggestionObj.nodeId
            : undefined,
        category:
          typeof suggestionObj.category === 'string'
            ? (suggestionObj.category as Suggestion['category'])
            : undefined,
      });
    }
  }

  return {
    path,
    issues,
    suggestions,
  };
}

/**
 * Analyzes a single story path using an LLM.
 *
 * **This is the primary analysis API.** Use this when users interactively select
 * a specific path to critique (e.g., by clicking nodes in a tree visualization).
 * Each path is analyzed in isolation for maximum accuracy.
 *
 * This function:
 * 1. Builds an analysis prompt from the path
 * 2. Calls the LLM via Vercel AI SDK (one API call)
 * 3. Parses the response into structured results
 *
 * @param path - The story path to analyze
 * @param options - Analysis configuration including the LLM model
 * @returns Analysis results with issues and suggestions
 * @throws {Error} If LLM call fails or response is invalid
 *
 * @example
 * ```typescript
 * import { openai } from '@ai-sdk/openai';
 * import { traverseTree } from 'react-story-tree';
 *
 * // User selects a specific path from the tree
 * const paths = traverseTree(nodes, structure, rootId);
 * const selectedPath = paths[userSelectedIndex];
 *
 * // Analyze just that path
 * const result = await analyzeStoryPath(selectedPath, {
 *   model: openai('gpt-5-mini'),
 *   rules: { continuity: true, logic: true }
 * });
 *
 * console.log(`Issues found: ${result.issues.length}`);
 * console.log(`Suggestions: ${result.suggestions.length}`);
 * ```
 */
export async function analyzeStoryPath(
  path: StoryPath,
  options: AnalysisOptions
): Promise<PathAnalysisResult> {
  const prompt = buildAnalysisPrompt(path, options);

  const response = await generateText({
    model: options.model,
    prompt,
    maxTokens: options.maxTokens,
  });

  return parseAnalysisResponse(response.text, path);
}

/**
 * Finds the root node of a tree structure.
 *
 * The root is a node that appears as a key in the structure but never
 * appears in any children arrays.
 *
 * @param structure - The tree structure to analyze
 * @param nodes - Map of all nodes
 * @returns The ID of the root node
 * @throws {Error} If no root node found or multiple roots exist
 */
function findRootNode(
  structure: TreeStructure,
  nodes: Map<string, StoryNode>
): string {
  const allNodeIds = Array.from(nodes.keys());
  const childNodeIds = new Set<string>();

  // Collect all node IDs that appear as children
  for (const children of Object.values(structure)) {
    for (const childId of children) {
      childNodeIds.add(childId);
    }
  }

  // Root nodes are those that never appear as children
  const rootCandidates = allNodeIds.filter((id) => !childNodeIds.has(id));

  if (rootCandidates.length === 0) {
    throw new Error(
      'No root node found. All nodes appear as children of other nodes (possible circular structure).'
    );
  }

  if (rootCandidates.length > 1) {
    throw new Error(
      `Multiple root nodes found: ${rootCandidates.join(', ')}. Please specify rootNodeId in options.`
    );
  }

  return rootCandidates[0]!;
}

/**
 * Deduplicates issues based on their content.
 *
 * Two issues are considered duplicates if they have the same:
 * - severity
 * - type
 * - nodeId
 * - message
 *
 * @param issues - Array of issues to deduplicate
 * @returns Array with duplicate issues removed
 */
function deduplicateIssues(issues: AnalysisIssue[]): AnalysisIssue[] {
  const seen = new Set<string>();
  const unique: AnalysisIssue[] = [];

  for (const issue of issues) {
    const key = `${issue.severity}|${issue.type}|${issue.nodeId}|${issue.message}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(issue);
    }
  }

  return unique;
}

/**
 * Deduplicates suggestions based on their content.
 *
 * Two suggestions are considered duplicates if they have the same message.
 *
 * @param suggestions - Array of suggestions to deduplicate
 * @returns Array with duplicate suggestions removed
 */
function deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  const unique: Suggestion[] = [];

  for (const suggestion of suggestions) {
    if (!seen.has(suggestion.message)) {
      seen.add(suggestion.message);
      unique.push(suggestion);
    }
  }

  return unique;
}

/**
 * Analyzes an entire story tree by analyzing ALL possible paths.
 *
 * **⚠️ WARNING: This makes one LLM API call per path.**
 * For a tree with 10 endings, this makes 10 separate API calls sequentially.
 * Use this for comprehensive reports or small trees only.
 *
 * **For interactive use, prefer `analyzeStoryPath()` on user-selected paths.**
 *
 * This function:
 * 1. Traverses the tree to find all paths (root to every leaf)
 * 2. Analyzes each path with the LLM (separate calls for isolation/accuracy)
 * 3. Aggregates results and calculates statistics
 * 4. Deduplicates issues and suggestions across paths
 *
 * @param nodes - Map of all story nodes
 * @param structure - Tree structure defining relationships
 * @param options - Analysis configuration
 * @returns Complete analysis with aggregated results and statistics
 * @throws {Error} If root node not found or traversal fails
 *
 * @example
 * ```typescript
 * import { openai } from '@ai-sdk/openai';
 *
 * // For a comprehensive report (expensive!)
 * const result = await analyzeStory(nodes, structure, {
 *   model: openai('gpt-5-mini'),
 *   rules: { continuity: true, logic: true },
 * });
 *
 * console.log(`Analyzed ${result.statistics.totalPaths} paths`);
 * console.log(`Found ${result.allIssues.length} unique issues`);
 * console.log(`Cost: ~${result.statistics.totalPaths} API calls`);
 * ```
 */
export async function analyzeStory(
  nodes: Map<string, StoryNode>,
  structure: TreeStructure,
  options: AnalysisOptions
): Promise<StoryAnalysisResult> {
  // Determine root node
  const rootId = options.rootNodeId || findRootNode(structure, nodes);

  // Traverse tree to get all paths
  const paths = traverseTree(nodes, structure, rootId);

  // Analyze each path
  const pathResults: PathAnalysisResult[] = [];

  for (const path of paths) {
    const result = await analyzeStoryPath(path, options);
    pathResults.push(result);
  }

  // Aggregate issues and suggestions
  const allIssues = deduplicateIssues(
    pathResults.flatMap((result) => result.issues)
  );

  const allSuggestions = deduplicateSuggestions(
    pathResults.flatMap((result) => result.suggestions)
  );

  // Calculate statistics
  const pathLengths = paths.map((path) => path.nodes.length);
  const totalNodes = nodes.size;
  const totalPaths = paths.length;
  const leafNodes = Object.values(structure).filter(
    (children) => children.length === 0
  ).length;

  const averagePathLength =
    pathLengths.reduce((sum, len) => sum + len, 0) / pathLengths.length;
  const maxPathLength = Math.max(...pathLengths);
  const minPathLength = Math.min(...pathLengths);

  return {
    pathResults,
    allIssues,
    allSuggestions,
    statistics: {
      totalNodes,
      totalPaths,
      averagePathLength,
      leafNodes,
      maxPathLength,
      minPathLength,
    },
  };
}
