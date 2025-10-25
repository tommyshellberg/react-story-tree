/**
 * @file Main evaluation script for story analysis
 * @description Runs the full evaluation suite against test dataset using Langsmith
 */

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import * as fs from 'fs';
import * as path from 'path';
// Import directly from analysis module to avoid React component CSS imports
import { analyzeStoryPath } from '../../src/analysis/analyzer';
import { buildPathFromNodes } from '../../src/utils/traversal';
import type { StoryNode, TreeStructure, AnalysisOptions } from '../../src/types';
import {
  calculateIssueDetectionMetrics,
  formatMetrics,
  type ExpectedIssue,
} from '../metrics/issue-detection';
import { initLangsmithClient, getProjectName } from '../langsmith-config';

// Load test dataset
const datasetPath = path.join(__dirname, '../datasets/test-stories.json');
const testCases = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

interface TestCase {
  id: string;
  name: string;
  difficulty: string;
  category: string;
  nodes: StoryNode[];
  structure: TreeStructure;
  rootId: string;
  expectedIssues: ExpectedIssue[];
}

/**
 * Run evaluation on a single test case
 */
async function evaluateTestCase(
  testCase: TestCase,
  options: AnalysisOptions
): Promise<{
  testCaseId: string;
  testCaseName: string;
  metrics: ReturnType<typeof calculateIssueDetectionMetrics>;
  detectedCount: number;
  expectedCount: number;
}> {
  // Convert nodes array to Map
  const nodesMap = new Map(testCase.nodes.map((node) => [node.id, node]));

  // Build path
  const path = buildPathFromNodes(
    Object.keys(testCase.structure),
    nodesMap,
    testCase.structure
  );

  // Run analysis
  console.log(`\n🔍 Analyzing: ${testCase.name} (${testCase.id})`);
  const result = await analyzeStoryPath(path, options);

  // Calculate metrics
  const metrics = calculateIssueDetectionMetrics(
    result.issues,
    testCase.expectedIssues
  );

  console.log(`  Detected: ${result.issues.length} issues`);
  console.log(`  Expected: ${testCase.expectedIssues.length} issues`);
  console.log(`  Precision: ${(metrics.precision * 100).toFixed(1)}%`);
  console.log(`  Recall: ${(metrics.recall * 100).toFixed(1)}%`);

  return {
    testCaseId: testCase.id,
    testCaseName: testCase.name,
    metrics,
    detectedCount: result.issues.length,
    expectedCount: testCase.expectedIssues.length,
  };
}

/**
 * Main evaluation function
 */
async function runEvaluation() {
  console.log('🚀 Starting Story Analysis Evaluation\n');

  // Check for required environment variables
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable required'
    );
  }

  // Initialize Langsmith (optional - only if API key provided)
  let langsmithClient;
  try {
    langsmithClient = initLangsmithClient();
    console.log(`📊 Langsmith project: ${getProjectName()}\n`);
  } catch (error) {
    console.log(
      '⚠️  Langsmith not configured (optional). Running without tracking.\n'
    );
  }

  // Determine model
  const model = process.env.OPENAI_API_KEY
    ? openai('gpt-5-mini')
    : anthropic('claude-3-5-sonnet-20241022');

  const modelName = process.env.OPENAI_API_KEY
    ? 'gpt-5-mini'
    : 'claude-3-5-sonnet-20241022';

  console.log(`🤖 Model: ${modelName}\n`);

  const options: AnalysisOptions = {
    model,
    rules: {
      continuity: true,
      logic: true,
      character: true,
      temporal: true,
    },
    maxTokens: 2000,
  };

  // Run evaluation on all test cases
  const results = [];
  for (const testCase of testCases as TestCase[]) {
    const result = await evaluateTestCase(testCase, options);
    results.push(result);

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Calculate aggregate metrics
  console.log('\n' + '='.repeat(60));
  console.log('📈 AGGREGATE RESULTS');
  console.log('='.repeat(60) + '\n');

  const totalTP = results.reduce((sum, r) => sum + r.metrics.truePositives, 0);
  const totalFP = results.reduce((sum, r) => sum + r.metrics.falsePositives, 0);
  const totalFN = results.reduce((sum, r) => sum + r.metrics.falseNegatives, 0);

  const overallPrecision = totalTP + totalFP > 0 ? totalTP / (totalTP + totalFP) : 0;
  const overallRecall = totalTP + totalFN > 0 ? totalTP / (totalTP + totalFN) : 0;
  const overallF1 =
    overallPrecision + overallRecall > 0
      ? (2 * overallPrecision * overallRecall) / (overallPrecision + overallRecall)
      : 0;

  console.log(`Total Test Cases: ${results.length}`);
  console.log(`Total True Positives: ${totalTP}`);
  console.log(`Total False Positives: ${totalFP}`);
  console.log(`Total False Negatives: ${totalFN}`);
  console.log('');
  console.log(`Overall Precision: ${(overallPrecision * 100).toFixed(1)}%`);
  console.log(`Overall Recall:    ${(overallRecall * 100).toFixed(1)}%`);
  console.log(`Overall F1 Score:  ${(overallF1 * 100).toFixed(1)}%`);

  // Breakdown by category
  console.log('\n' + '-'.repeat(60));
  console.log('By Category:');
  console.log('-'.repeat(60) + '\n');

  const categories = [...new Set(testCases.map((tc: TestCase) => tc.category))];
  for (const category of categories) {
    const categoryResults = results.filter((r) =>
      testCases.find(
        (tc: TestCase) => tc.id === r.testCaseId && tc.category === category
      )
    );

    const catTP = categoryResults.reduce((sum, r) => sum + r.metrics.truePositives, 0);
    const catFP = categoryResults.reduce((sum, r) => sum + r.metrics.falsePositives, 0);
    const catFN = categoryResults.reduce((sum, r) => sum + r.metrics.falseNegatives, 0);

    const catPrecision = catTP + catFP > 0 ? catTP / (catTP + catFP) : 0;
    const catRecall = catTP + catFN > 0 ? catTP / (catTP + catFN) : 0;

    console.log(`${category}:`);
    console.log(`  Cases: ${categoryResults.length}`);
    console.log(`  Precision: ${(catPrecision * 100).toFixed(1)}%`);
    console.log(`  Recall: ${(catRecall * 100).toFixed(1)}%`);
    console.log('');
  }

  // Save results to file
  const resultsPath = path.join(__dirname, '../results/latest-run.json');
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        model: modelName,
        testCases: results.length,
        metrics: {
          precision: overallPrecision,
          recall: overallRecall,
          f1Score: overallF1,
          truePositives: totalTP,
          falsePositives: totalFP,
          falseNegatives: totalFN,
        },
        detailedResults: results,
      },
      null,
      2
    )
  );

  console.log(`\n💾 Results saved to: ${resultsPath}`);
  console.log('\n✅ Evaluation complete!\n');
}

// Run evaluation
runEvaluation().catch((error) => {
  console.error('❌ Evaluation failed:', error);
  process.exit(1);
});
