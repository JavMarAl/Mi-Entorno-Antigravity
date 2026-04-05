---
name: perplexity-search
description: Perform AI-powered web searches with real-time information using Perplexity models via LiteLLM and OpenRouter. This skill should be used when conducting web searches for current information, finding recent scientific literature, getting grounded answers with source citations, or accessing information beyond the model knowledge cutoff. Provides access to multiple Perplexity models including Sonar Pro, Sonar Pro Search (advanced agentic search), and Sonar Reasoning Pro through a single OpenRouter API key.
license: MIT license
compatibility: An OpenRouter API key is required to use Perplexity search
metadata:
    skill-author: K-Dense Inc.
---

# Perplexity Search

## Overview

AI-powered web search using Perplexity models through LiteLLM and OpenRouter. Provides real-time, web-grounded answers with source citations. Requires one OpenRouter API key — no separate Perplexity account needed.

## When to Use

- Searching for current information (2024+) beyond training data cutoff
- Finding latest scientific publications and preprints
- Verifying facts with source citations
- Literature searches across domains
- Clinical, biomedical, or technical domain research

**Do NOT use** for simple logic, calculations, or questions well within training data.

## Quick Start

```bash
# 1. Install dependency
uv pip install litellm

# 2. Set API key
export OPENROUTER_API_KEY='sk-or-v1-your-key-here'

# 3. Verify setup
python scripts/perplexity_search.py --check-setup
```

## Usage

```bash
# Basic search
python scripts/perplexity_search.py "Latest CRISPR developments 2024"

# Save results
python scripts/perplexity_search.py "CAR-T therapy trials" --output results.json

# Specify model
python scripts/perplexity_search.py "Compare mRNA vs viral vector vaccines" --model sonar-pro-search

# Verbose output
python scripts/perplexity_search.py "Quantum computing drug discovery" --verbose
```

## Available Models

| Model | Use Case | Cost |
|-------|----------|------|
| `sonar-pro` | **Default** — general search | $0.002–0.005/query |
| `sonar-pro-search` | Complex multi-step analysis | $0.020–0.050/query |
| `sonar-reasoning-pro` | Step-by-step reasoning | $0.005–0.010/query |
| `sonar` | Simple fact lookups | $0.001–0.002/query |
| `sonar-reasoning` | Basic reasoning | Low cost |

## Programmatic Access

```python
from scripts.perplexity_search import search_with_perplexity

result = search_with_perplexity(
    query="What are the latest CRISPR developments?",
    model="openrouter/perplexity/sonar-pro",
    max_tokens=4000,
    temperature=0.2
)

if result["success"]:
    print(result["answer"])
```

## Effective Query Design

- **Be specific**: Include domain, time frame, constraints
- **Use time constraints**: "published in 2024", "past 6 months"
- **Specify sources**: "from peer-reviewed publications", "from FDA"
- **Bad**: `"cancer treatment"` → **Good**: `"CAR-T clinical trial results for B-cell lymphoma in 2024"`

## Integration with Other Skills

| Skill | How to integrate |
|-------|----------------|
| `literature-review` | Find recent papers beyond database indexing |
| `hypothesis-generation` | Discover latest research findings and gaps |
| `citation-management` | Verify citations and find related work |
| `peer-review` | Find current evidence for/against claims |

## Resources

- `scripts/perplexity_search.py` — Main search script (CLI + Python module)
- `scripts/setup_env.py` — Environment setup and validation
- `references/search_strategies.md` — Comprehensive query design guide
- `references/model_comparison.md` — Model comparison, use cases, pricing
- `references/openrouter_setup.md` — Setup, troubleshooting, security
- `assets/.env.example` — Environment template

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | ✅ Yes | — |
| `DEFAULT_MODEL` | No | `sonar-pro` |
| `DEFAULT_MAX_TOKENS` | No | `4000` |
| `DEFAULT_TEMPERATURE` | No | `0.2` |

## Cost Optimization

1. Use `sonar` for simple facts, `sonar-pro` for most queries
2. Reserve `sonar-pro-search` for complex multi-step analysis
3. Set `--max-tokens` to limit response length
4. Monitor usage at https://openrouter.ai/activity
