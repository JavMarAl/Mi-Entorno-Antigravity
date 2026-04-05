---
name: notebooklm
description: "Use this skill to query your Google NotebookLM notebooks directly from Claude Code for source-grounded, citation-backed answers from Gemini. Browser automation, library management, persistent auth."
risk: safe
source: community
date_added: "2026-03-11"
---

# NotebookLM Research Assistant Skill

Interact with Google NotebookLM to query documentation with Gemini's source-grounded answers.

## ⚠️ CRITICAL: Always Use run.py Wrapper
**NEVER call scripts directly. ALWAYS use `python scripts/run.py [script]`:**
```bash
python scripts/run.py ask_question.py --question "..."
```
The `run.py` wrapper manages the virtual environment, dependencies, and browser installation automatically.

## Core Workflow

### 1. Authentication
- **Setup**: `python scripts/run.py auth_manager.py setup` (Browser MUST be visible for Google login).
- **Status**: `python scripts/run.py auth_manager.py status`.

### 2. Notebook Management
- **List**: `python scripts/run.py notebook_manager.py list`.
- **Smart Add**: 
  1. Query content: `python scripts/run.py ask_question.py --question "What is the content of this notebook?" --notebook-url "[URL]"`
  2. Add with metadata: `python scripts/run.py notebook_manager.py add --url "[URL]" --name "[Content]" --description "[Content]" --topics "[Content]"`
- **Activate**: `python scripts/run.py notebook_manager.py activate --id ID`.

### 3. Research/Querying
- **Ask**: `python scripts/run.py ask_question.py --question "..."`.
- **Follow-up**: Analyze if the answer is complete. If not, ask follow-up questions using the same interface until satisfied.
- **Synthesize**: Combine multiple responses before delivering the final answer to the user.

## Quality Rules
- **Source-Grounded**: Ensure answers include citations from the notebook.
- **Verification**: If an answer ends with "Is that ALL you need?", investigate for missing information.
- **Stealth**: Human-like typing and behavior are enabled by default for stability.

## Resources
- **scripts/**: Automation scripts for auth, management, and queries.
- **references/troubleshooting.md**: Common browser and auth issues.
- **references/api_reference.md**: Detailed CLI arguments for all scripts.
