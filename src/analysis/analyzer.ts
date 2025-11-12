/**
 * @file Story analysis engine powered by LLM
 * @module analysis/analyzer
 */

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
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
  LLMProvider,
} from '../types';

/**
 * Creates an AI model instance based on provider configuration.
 *
 * This function abstracts away the AI SDK implementation from library consumers.
 * They don't need to know about or import AI SDK packages - just provide their
 * API key and model name.
 *
 * @param provider - The LLM provider to use ('anthropic' | 'openai')
 * @param apiKey - API key for the provider
 * @param modelName - Optional model name (uses provider default if not specified)
 * @returns Configured model instance for use with Vercel AI SDK
 * @throws {Error} If provider is not supported or API key is missing
 *
 * @example
 * ```typescript
 * // Anthropic (Claude)
 * const anthropicModel = createModel('anthropic', process.env.ANTHROPIC_API_KEY);
 * // Returns: anthropic('claude-3-5-sonnet-20241022')
 *
 * // OpenAI (GPT)
 * const openaiModel = createModel('openai', process.env.OPENAI_API_KEY);
 * // Returns: openai('gpt-5-mini')
 *
 * // With custom model
 * const customModel = createModel('openai', process.env.OPENAI_API_KEY, 'gpt-4o');
 * ```
 */
function createModel(
  provider: LLMProvider,
  apiKey: string,
  modelName?: string
) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      `API key is required for ${provider} provider. ` +
        `Please provide a valid API key in the analysisOptions.`
    );
  }

  switch (provider) {
    case 'anthropic': {
      const defaultModel = 'claude-3-5-sonnet-20241022';
      const model = modelName || defaultModel;

      // Create anthropic provider with explicit API key
      const anthropicProvider = createAnthropic({ apiKey });

      // Return the model instance
      return anthropicProvider(model);
    }

    case 'openai': {
      const defaultModel = 'gpt-5-mini';
      const model = modelName || defaultModel;

      // Create OpenAI provider with explicit API key
      const openaiProvider = createOpenAI({ apiKey });

      // Return the model instance
      return openaiProvider(model);
    }

    default:
      throw new Error(
        `Unsupported LLM provider: ${provider}. ` +
          `Currently supported providers: 'anthropic', 'openai'`
      );
  }
}

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
    // Truncate long responses for readability
    const truncatedResponse =
      jsonText.length > 500
        ? jsonText.substring(0, 500) + '...[truncated]'
        : jsonText;

    throw new Error(
      `Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `Response text: "${truncatedResponse}". ` +
        `This usually means the LLM didn't follow the JSON format instructions. ` +
        `Try adjusting your prompt or using a different model.`
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
  const skippedSuggestions: unknown[] = [];

  if (Array.isArray(data.suggestions)) {
    for (const suggestion of data.suggestions) {
      if (!suggestion || typeof suggestion !== 'object') {
        skippedSuggestions.push(suggestion);
        continue; // Skip invalid suggestions
      }

      const suggestionObj = suggestion as Record<string, unknown>;

      if (typeof suggestionObj.message !== 'string') {
        skippedSuggestions.push(suggestion);
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

  // Warn about skipped suggestions
  if (skippedSuggestions.length > 0) {
    console.warn(
      `Skipped ${skippedSuggestions.length} invalid suggestion(s) from LLM response. ` +
        `This might indicate the LLM isn't following the output format correctly. ` +
        `First invalid suggestion: ${JSON.stringify(skippedSuggestions[0])}`
    );
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
 * 1. Creates an AI model from provider configuration (abstracted away from you!)
 * 2. Builds an analysis prompt from the path
 * 3. Calls the LLM via Vercel AI SDK (one API call)
 * 4. Parses the response into structured results
 *
 * **You don't need to install or import any AI SDK packages!** Just provide your
 * API key and the library handles the rest.
 *
 * @param path - The story path to analyze
 * @param options - Analysis configuration (provider, API key, rules, etc.)
 * @returns Analysis results with issues and suggestions
 * @throws {Error} If API key is missing, LLM call fails, or response is invalid
 *
 * @example
 * ```typescript
 * import { traverseTree, analyzeStoryPath } from 'react-story-tree';
 *
 * // User selects a specific path from the tree
 * const paths = traverseTree(nodes, structure, rootId);
 * const selectedPath = paths[userSelectedIndex];
 *
 * // Analyze with Anthropic (Claude)
 * const result = await analyzeStoryPath(selectedPath, {
 *   provider: 'anthropic',
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   rules: { continuity: true, logic: true }
 * });
 *
 * // Or analyze with OpenAI (GPT)
 * const result = await analyzeStoryPath(selectedPath, {
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY,
 *   modelName: 'gpt-5-mini', // optional, this is the default
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
  // Create the AI model internally - consumers don't need to know about this!
  const model = createModel(options.provider, options.apiKey, options.modelName);

  const prompt = buildAnalysisPrompt(path, options);

  try {
    const response = await generateText({
      model,
      prompt,
      ...(options.maxTokens && { maxTokens: options.maxTokens }),
    });

    return parseAnalysisResponse(response.text, path);
  } catch (error) {
    // Enrich error with context about which path failed
    const pathDescription = `[${path.nodeIds.join(' → ')}]`;
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Failed to analyze story path ${pathDescription}: ${errorMessage}. ` +
        `Provider: ${options.provider}, Model: ${options.modelName || 'default'}. ` +
        `This could be due to: network issues, invalid API key, rate limits, or provider errors.`
    );
  }
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
 * We use all four fields for uniqueness because the same logical issue
 * in the same node might have different contexts. This ensures we don't
 * lose granular issue tracking while still removing true duplicates.
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
 * We use only the message for uniqueness (not nodeId or category) because
 * suggestions are typically general advice that applies broadly across the
 * story. NodeId and category are supplementary context, not part of the
 * suggestion's identity.
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
 * 1. Creates an AI model from provider configuration (abstracted away from you!)
 * 2. Traverses the tree to find all paths (root to every leaf)
 * 3. Analyzes each path with the LLM (separate calls for isolation/accuracy)
 * 4. Aggregates results and calculates statistics
 * 5. Deduplicates issues and suggestions across paths
 *
 * **You don't need to install or import any AI SDK packages!** Just provide your
 * API key and the library handles the rest.
 *
 * @param nodes - Map of all story nodes
 * @param structure - Tree structure defining relationships
 * @param options - Analysis configuration (provider, API key, rules, etc.)
 * @returns Complete analysis with aggregated results and statistics
 * @throws {Error} If API key is missing, root node not found, or traversal fails
 *
 * @example
 * ```typescript
 * import { analyzeStory } from 'react-story-tree';
 *
 * // Comprehensive report with Anthropic (expensive!)
 * const result = await analyzeStory(nodes, structure, {
 *   provider: 'anthropic',
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   rules: { continuity: true, logic: true },
 * });
 *
 * // Or with OpenAI
 * const result = await analyzeStory(nodes, structure, {
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY,
 *   modelName: 'gpt-5-mini', // optional, this is the default
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

  // Analyze each path (the analyzeStoryPath function handles model creation internally)
  const pathResults: PathAnalysisResult[] = [];
  const errors: Array<{ pathIndex: number; path: StoryPath; error: Error }> = [];

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]!;

    try {
      const result = await analyzeStoryPath(path, options);
      pathResults.push(result);
    } catch (error) {
      // Log error but continue with remaining paths
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push({ pathIndex: i, path, error: err });

      console.error(
        `Failed to analyze path ${i + 1}/${paths.length} ` +
          `[${path.nodeIds.join(' → ')}]: ${err.message}`
      );
    }
  }

  // If ALL paths failed, this is critical - throw error
  if (pathResults.length === 0) {
    throw new Error(
      `Failed to analyze any paths. All ${paths.length} path(s) failed. ` +
        `First error: ${errors[0]?.error.message || 'Unknown error'}. ` +
        `This likely indicates an invalid API key, network issue, or unsupported model.`
    );
  }

  // If SOME paths failed, warn but continue with partial results
  if (errors.length > 0) {
    console.warn(
      `Warning: ${errors.length}/${paths.length} path(s) failed to analyze. ` +
        `Continuing with ${pathResults.length} successful results. ` +
        `Failed path indices: ${errors.map((e) => e.pathIndex + 1).join(', ')}`
    );
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
