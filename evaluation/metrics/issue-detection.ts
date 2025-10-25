/**
 * @file Evaluation metrics for story analysis issue detection
 * @description Functions to calculate precision, recall, and accuracy of LLM issue detection
 */

import type { AnalysisIssue } from '../../src/types';

/**
 * Expected issue from ground truth dataset
 */
export interface ExpectedIssue {
  severity: 'error' | 'warning' | 'info';
  type: 'continuity' | 'logic' | 'character' | 'temporal' | 'other';
  nodeId: string;
  message: string;
}

/**
 * Result of evaluating issue detection
 */
export interface IssueDetectionMetrics {
  /** True Positives: Correctly identified issues */
  truePositives: number;

  /** False Positives: Incorrectly flagged as issues */
  falsePositives: number;

  /** False Negatives: Missed real issues */
  falseNegatives: number;

  /** Precision: Of flagged issues, how many are correct? (TP / (TP + FP)) */
  precision: number;

  /** Recall: Of real issues, how many were caught? (TP / (TP + FN)) */
  recall: number;

  /** F1 Score: Harmonic mean of precision and recall */
  f1Score: number;

  /** False Positive Rate: How often do we incorrectly flag issues? */
  falsePositiveRate: number;

  /** Detailed breakdown by issue type */
  byType: Record<
    string,
    {
      truePositives: number;
      falsePositives: number;
      falseNegatives: number;
      precision: number;
      recall: number;
    }
  >;
}

/**
 * Check if two issues match (for calculating TP/FP/FN)
 *
 * Issues match if they:
 * 1. Reference the same node
 * 2. Have the same type (continuity, logic, etc.)
 * 3. Optionally same severity
 *
 * @param detected - Issue detected by the LLM
 * @param expected - Ground truth issue
 * @param matchSeverity - Whether severity must also match (default: false)
 */
function issuesMatch(
  detected: AnalysisIssue,
  expected: ExpectedIssue,
  matchSeverity = false
): boolean {
  const nodeMatch = detected.nodeId === expected.nodeId;
  const typeMatch = detected.type === expected.type;
  const severityMatch = matchSeverity
    ? detected.severity === expected.severity
    : true;

  return nodeMatch && typeMatch && severityMatch;
}

/**
 * Calculate issue detection metrics by comparing detected issues to expected issues
 *
 * @param detectedIssues - Issues found by the LLM
 * @param expectedIssues - Ground truth issues from the dataset
 * @param matchSeverity - Whether to require severity to match (default: false)
 * @returns Comprehensive metrics about detection quality
 *
 * @example
 * ```typescript
 * const metrics = calculateIssueDetectionMetrics(
 *   result.issues,
 *   testCase.expectedIssues
 * );
 *
 * console.log(`Precision: ${metrics.precision.toFixed(2)}`);
 * console.log(`Recall: ${metrics.recall.toFixed(2)}`);
 * console.log(`F1 Score: ${metrics.f1Score.toFixed(2)}`);
 * ```
 */
export function calculateIssueDetectionMetrics(
  detectedIssues: AnalysisIssue[],
  expectedIssues: ExpectedIssue[],
  matchSeverity = false
): IssueDetectionMetrics {
  // Calculate True Positives: detected issues that match expected issues
  const truePositives = detectedIssues.filter((detected) =>
    expectedIssues.some((expected) =>
      issuesMatch(detected, expected, matchSeverity)
    )
  );

  // Calculate False Positives: detected issues that don't match any expected issue
  const falsePositives = detectedIssues.filter(
    (detected) =>
      !expectedIssues.some((expected) =>
        issuesMatch(detected, expected, matchSeverity)
      )
  );

  // Calculate False Negatives: expected issues that weren't detected
  const falseNegatives = expectedIssues.filter(
    (expected) =>
      !detectedIssues.some((detected) =>
        issuesMatch(detected, expected, matchSeverity)
      )
  );

  const tp = truePositives.length;
  const fp = falsePositives.length;
  const fn = falseNegatives.length;

  // Calculate overall metrics
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const falsePositiveRate = fp / (fp + tp + fn || 1);

  // Calculate per-type metrics
  const issueTypes = new Set([
    ...detectedIssues.map((i) => i.type),
    ...expectedIssues.map((i) => i.type),
  ]);

  const byType: Record<string, any> = {};

  for (const type of issueTypes) {
    const detectedOfType = detectedIssues.filter((i) => i.type === type);
    const expectedOfType = expectedIssues.filter((i) => i.type === type);

    const tpType = detectedOfType.filter((detected) =>
      expectedOfType.some((expected) =>
        issuesMatch(detected, expected, matchSeverity)
      )
    ).length;

    const fpType = detectedOfType.filter(
      (detected) =>
        !expectedOfType.some((expected) =>
          issuesMatch(detected, expected, matchSeverity)
        )
    ).length;

    const fnType = expectedOfType.filter(
      (expected) =>
        !detectedOfType.some((detected) =>
          issuesMatch(detected, expected, matchSeverity)
        )
    ).length;

    const precisionType = tpType + fpType > 0 ? tpType / (tpType + fpType) : 0;
    const recallType = tpType + fnType > 0 ? tpType / (tpType + fnType) : 0;

    byType[type] = {
      truePositives: tpType,
      falsePositives: fpType,
      falseNegatives: fnType,
      precision: precisionType,
      recall: recallType,
    };
  }

  return {
    truePositives: tp,
    falsePositives: fp,
    falseNegatives: fn,
    precision,
    recall,
    f1Score,
    falsePositiveRate,
    byType,
  };
}

/**
 * Format metrics for console display
 */
export function formatMetrics(metrics: IssueDetectionMetrics): string {
  const lines = [
    '=== Issue Detection Metrics ===',
    '',
    `True Positives:  ${metrics.truePositives}`,
    `False Positives: ${metrics.falsePositives}`,
    `False Negatives: ${metrics.falseNegatives}`,
    '',
    `Precision: ${(metrics.precision * 100).toFixed(1)}%`,
    `Recall:    ${(metrics.recall * 100).toFixed(1)}%`,
    `F1 Score:  ${(metrics.f1Score * 100).toFixed(1)}%`,
    `FP Rate:   ${(metrics.falsePositiveRate * 100).toFixed(1)}%`,
    '',
    '=== By Issue Type ===',
  ];

  for (const [type, typeMetrics] of Object.entries(metrics.byType)) {
    lines.push('');
    lines.push(`${type}:`);
    lines.push(
      `  TP: ${typeMetrics.truePositives}, FP: ${typeMetrics.falsePositives}, FN: ${typeMetrics.falseNegatives}`
    );
    lines.push(
      `  Precision: ${(typeMetrics.precision * 100).toFixed(1)}%, Recall: ${(typeMetrics.recall * 100).toFixed(1)}%`
    );
  }

  return lines.join('\n');
}
