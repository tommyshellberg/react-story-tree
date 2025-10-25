# Story Analysis Evaluation

This directory contains the evaluation infrastructure for systematically testing and improving the LLM-powered story analysis prompts.

## Overview

The evaluation system measures how well the story analyzer detects issues in branching narratives by:
1. Running analysis on stories with **known issues** (ground truth)
2. Comparing detected issues to expected issues
3. Calculating metrics: **precision**, **recall**, **F1 score**, **false positive rate**

This enables data-driven prompt iteration and quality tracking.

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example file and add your API keys:

```bash
cp .env.evaluation.example .env.evaluation
```

Edit `.env.evaluation`:

```bash
# Required: LLM provider API key
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Langsmith tracking
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=react-story-tree-eval
```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys
- Langsmith: https://smith.langchain.com/settings

### 3. Run Evaluation

```bash
pnpm eval
```

This will:
- Load test dataset from `datasets/test-stories.json`
- Run analysis on each story
- Calculate metrics
- Save results to `results/latest-run.json`
- Print summary to console

## Understanding the Metrics

### Precision
**Of the issues we flagged, how many were real?**

```
Precision = True Positives / (True Positives + False Positives)
```

- **High precision** (90%+): Few false alarms, but might miss some issues
- **Low precision** (<70%): Many false positives, flagging non-issues

### Recall
**Of the real issues, how many did we catch?**

```
Recall = True Positives / (True Positives + False Negatives)
```

- **High recall** (90%+): Catches most issues, but may have false positives
- **Low recall** (<70%): Missing many real issues

### F1 Score
**Harmonic mean of precision and recall** (balanced measure)

```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

- **Target**: F1 > 85% for production readiness

### False Positive Rate
**How often we incorrectly flag issues**

- **Target**: FP Rate < 15%

## Test Dataset

Located in `datasets/test-stories.json`. Each test case includes:

```json
{
  "id": "continuity-001",
  "name": "Disappearing Sword",
  "difficulty": "easy",
  "category": "continuity",
  "nodes": [...],
  "structure": {...},
  "rootId": "node-1",
  "expectedIssues": [
    {
      "severity": "error",
      "type": "continuity",
      "nodeId": "node-2",
      "message": "Sword disappeared - character picked up sword but has no weapon"
    }
  ]
}
```

### Test Categories

- **continuity**: Object/location consistency
- **logic**: Impossible actions, contradictions
- **character**: Character state consistency
- **temporal**: Time consistency
- **clean**: Stories with no issues (for false positive testing)
- **multiple**: Stories with multiple issue types

### Adding New Test Cases

1. Add to `datasets/test-stories.json`
2. Include ground truth `expectedIssues`
3. Run evaluation to see if the LLM catches it

## Evaluation Workflow

### 1. Baseline Evaluation

```bash
pnpm eval
```

Record baseline metrics.

### 2. Iterate on Prompts

Edit `src/analysis/analyzer.ts` → `buildAnalysisPrompt()`

### 3. Re-evaluate

```bash
pnpm eval
```

### 4. Compare Results

Check `results/latest-run.json` for detailed breakdown.

### 5. Track in Langsmith (Optional)

If Langsmith is configured, all runs are automatically tracked with:
- Input stories
- Detected issues
- Metrics
- Model/prompt version

View at: https://smith.langchain.com/

## Example Output

```
🚀 Starting Story Analysis Evaluation

📊 Langsmith project: react-story-tree-eval
🤖 Model: gpt-5-mini

🔍 Analyzing: Disappearing Sword (continuity-001)
  Detected: 1 issues
  Expected: 1 issues
  Precision: 100.0%
  Recall: 100.0%

🔍 Analyzing: Dead Character Returns (logic-001)
  Detected: 2 issues
  Expected: 2 issues
  Precision: 100.0%
  Recall: 100.0%

============================================================
📈 AGGREGATE RESULTS
============================================================

Total Test Cases: 8
Total True Positives: 12
Total False Positives: 3
Total False Negatives: 2

Overall Precision: 80.0%
Overall Recall:    85.7%
Overall F1 Score:  82.8%

------------------------------------------------------------
By Category:
------------------------------------------------------------

continuity:
  Cases: 2
  Precision: 75.0%
  Recall: 100.0%

logic:
  Cases: 2
  Precision: 90.0%
  Recall: 85.0%

...

💾 Results saved to: evaluation/results/latest-run.json
✅ Evaluation complete!
```

## Interpreting Results

### Good Performance

```
Precision: 90%+
Recall: 85%+
F1 Score: 87%+
FP Rate: <10%
```

→ Prompt is production-ready

### Needs Improvement

```
Precision: <75%  → Too many false positives
Recall: <70%     → Missing too many real issues
```

→ Iterate on prompt instructions

### Common Issues

**High FP, Good Recall**:
- Prompt is too sensitive
- Add examples of what's NOT an issue
- Add "only flag clear errors" instruction

**Good Precision, Low Recall**:
- Prompt is too conservative
- Add more examples of subtle issues
- Emphasize catching all issue types

## Files

```
evaluation/
├── README.md                    # This file
├── langsmith-config.ts          # Langsmith client setup
├── datasets/
│   └── test-stories.json        # Ground truth test cases
├── metrics/
│   └── issue-detection.ts       # Precision/recall calculations
├── scripts/
│   └── run-eval.ts             # Main evaluation script
└── results/
    └── latest-run.json         # Most recent results (git-ignored)
```

## Future Enhancements

- [ ] A/B testing framework (compare two prompts)
- [ ] Prompt versioning and changelog
- [ ] Statistical significance testing
- [ ] More test cases (target: 50+)
- [ ] Category-specific prompts (if single prompt performs poorly)
- [ ] Automated regression testing in CI/CD

## Notes

- Evaluation files are **not shipped to npm** (devDependencies only)
- Results are git-ignored to avoid commit clutter
- Langsmith is optional but recommended for systematic tracking
- Eval costs: ~$0.03-0.10 per full run with GPT-5

## Questions?

See main README or open an issue: https://github.com/tommyshellberg/react-story-tree/issues
