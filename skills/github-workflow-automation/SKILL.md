---
name: github-workflow-automation
description: "Automate GitHub workflows with AI assistance. Includes PR reviews, issue triage, CI/CD integration, and Git operations."
risk: safe
source: community
date_added: "2026-03-11"
---

# 🔧 GitHub Workflow Automation

Patterns for automating GitHub workflows with AI assistance, inspired by modern DevOps practices and AI-driven automation.

## Core Workflows

### 1. Automated PR Review
- Use GitHub Actions to analyze PR diffs.
- Provide AI-generated summaries, issue detection, and improvement suggestions.
- Implement focused reviews by filtering code files (TS/JS/PY/GO).

### 2. Issue Triage Automation
- Auto-labeling based on AI analysis of title and body.
- Severity and area classification (frontend/backend/api).
- Automated initial responses to request missing repro steps.

### 3. CI/CD Integration
- **Smart Test Selection**: Run only tests relevant to the changed files.
- **Risk Assessment**: AI-driven analysis of commit logs before production deployment.
- **Rollback Automation**: Automated return to last stable version with team notification.

### 4. Git Operations
- **Auto Rebase**: Integration to rebase PRs via `/rebase` comments.
- **Smart Cherry-Pick**: AI-assisted conflict resolution during cherry-pick operations.
- **Branch Cleanup**: Scheduled identification and notification of stale branches.

### 5. On-Demand Assistance
- **Mention Bots**: `@ai-helper` style interactions for code explanation or fix suggestions.
- **Command Patterns**: Standardized slash commands for docs, tests, and labeling.

## Best Practices
- **Security**: Use GitHub Secrets for API keys, minimize workflow permissions.
- **Performance**: Cache dependencies and use path filters to skip unnecessary jobs.
- **Reliability**: Implement timeouts and retry logic for network-dependent actions.

## Resources
- **workflows/ai-review.yml**: Template for AI-powered code review.
- **workflows/issue-triage.yml**: Workflow for automated issue labeling and triage.
- **docs/stale-management.yml**: Pattern for managing stale issues and PRs.
