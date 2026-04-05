---
name: doc-coauthoring
description: "Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs, or similar structured content."
risk: safe
source: community
date_added: "2026-02-27"
---

# Doc Co-Authoring Workflow

A structured workflow for guiding users through collaborative document creation. Act as an active guide, walking users through three stages: Context Gathering, Refinement & Structure, and Reader Testing.

## Use this Skill when

- User mentions writing documentation: "write a doc", "draft a proposal", "create a spec", "write up".
- User mentions specific doc types: "PRD", "design doc", "decision doc", "RFC".

## Workflow Stages

### Stage 1: Context Gathering (Atomic)
- **Goal**: Close the gap between user knowledge and AI baseline.
1. **Initial Questions**: Ask about doc type, audience, impact, and template format.
2. **Info Dumping**: Encourage the user to dump background, discussions, alternatives, and technical architecture without worrying about organization.
3. **Clarifying Questions**: Generate 5-10 specific questions based on context gaps.

### Stage 2: Refinement & Structure
- **Goal**: Build the document section by section through iterative refinement.
1. **Scaffolding**: Create the initial document structure with placeholders.
2. **Section Building**: For each section:
   - Ask clarifying questions.
   - Brainstorm 5-20 options.
   - User curates (keeps/removes/combines).
   - Draft and refine iteratively.

### Stage 3: Reader Testing
- **Goal**: Test the document with a "fresh" AI instance (no context) to catch blind spots.
1. **Predict Reader Questions**: Generate 5-10 questions a reader would realistically ask.
2. **Sub-Agent Test**: Invoke a sub-agent/fresh instance with only the doc content to answer the questions.
3. **Fix Gaps**: Refine the document based on failures or ambiguities found during testing.

## Quality Checklist

- [ ] Meta-context gathered.
- [ ] Brainstorming options provided for each section.
- [ ] Section drafted and iteratively refined.
- [ ] Reader testing passed with fresh context.
- [ ] Final self-review by user recommended.

## Templates

- **templates/prd-template.md**: Product Requirements Document.
- **templates/rfc-template.md**: Request for Comment.
- **templates/design-doc-template.md**: Technical Design Document.
