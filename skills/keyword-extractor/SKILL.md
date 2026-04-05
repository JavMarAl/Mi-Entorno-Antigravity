---
name: keyword-extractor
description: Extracts up to 50 highly relevant SEO keywords from text. Use when user wants to generate or extract keywords for given text.
risk: safe
source: original
date_added: "2026-03-11"
---

# Keyword Extractor

Extracts **max 50 relevant keywords** from text and formats them in a strict machine-ready structure.

## Core Mandate
Return **exactly one comma-separated line** of keywords:
- Max 50 keywords, ordered by relevance.
- All lowercase, no duplicates.
- Mix of single words and 2–4 word phrases.
- No numbering, bullets, explanations, or trailing period.

## Workflow

### 1. Analyze
Identify main subjects, domain terminology, entities, and key concepts. Ignore filler words.

### 2. Generate
Include core topics and common search queries. Keywords must not exceed 4 words.

### 3. Rank
Order by SEO importance (main topic > high-value terminology > entities > contextual topics).

### 4. Normalize & Validate
Ensure lowercase, comma-separated, and no near-duplicates. Ensure strictly searchable topics.

## Quality Rules
- **Prefer**: Noun phrases, domain terminology, technical concepts.
- **Avoid**: Verbs/adjectives without nouns, filler phrases ("various topics", "important ideas").
- **Constraint**: Each keyword must represent a phrase a user would type into a search engine.

## Resources
- **docs/quality-rules.md**: Detailed taxonomy of forbidden and preferred terms.
- **examples/extraction-examples.txt**: Dataset of text-to-keyword mappings for validation.
