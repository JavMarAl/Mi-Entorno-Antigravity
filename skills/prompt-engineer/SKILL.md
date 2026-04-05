---
name: prompt-engineer
description: "Transforms user prompts into optimized prompts using frameworks (RTF, RISEN, Chain of Thought, RODES, Chain of Density, RACE, RISE, STAR, SOAP, CLEAR, GROW)"
category: automation
risk: safe
source: community
tags: "[prompt-engineering, optimization, frameworks, ai-enhancement]"
date_added: "2026-03-11"
---

# Prompt Engineer Skill

This skill transforms raw, unstructured user prompts into highly optimized prompts using established prompting frameworks.

## Purpose
Analyze user intent, identify task complexity, and intelligently select the most appropriate framework(s) to maximize LLM output quality. Operates in "magic mode" (invisible selection).

## Workflow

### 1. Analyze Intent
- Detect task type (coding, writing, analysis, etc.) and complexity.
- Identify implicit requirements and constraints.

### 2. Select Framework(s)
| Task Type | Recommended Framework(s) |
|-----------|-------------------------|
| **Role-based** | **RTF** (Role-Task-Format) |
| **Reasoning** | **Chain of Thought** |
| **Structured Projects** | **RISEN** (Role, Instructions, Steps, End goal, Narrowing) |
| **Design/Analysis** | **RODES** (Role, Objective, Details, Examples, Sense check) |
| **Summarization** | **Chain of Density** |
| **Communication** | **RACE** (Role, Audience, Context, Expectation) |
| **Investigation** | **RISE** (Research, Investigate, Synthesize, Evaluate) |

### 3. Generate and Optimize
- Blend frameworks when appropriate.
- Adapt language to the user's input.
- verified self-containment, specificity, and clear output formatting.

## Critical Rules
- **Magic Mode**: Never explain the framework choice to the user.
- **Customization**: Always customize to the specific context; never use one-size-fits-all prompts.
- **Clarity**: Use code blocks for final prompts and ensure they are self-contained.

## Resources
- **docs/framework-guide.md**: Detailed breakdown of each prompting framework.
- **docs/meta-prompting.md**: Advanced techniques for multi-step prompt engineering.
- **examples/**: Optimized prompt templates for various domains.
