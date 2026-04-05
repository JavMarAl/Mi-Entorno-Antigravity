---
name: github-automation
description: "Automate GitHub repositories, issues, pull requests, branches, CI/CD, and permissions via Rube MCP (Composio)."
risk: unknown
source: community
date_added: "2026-03-11"
---

# GitHub Automation via Rube MCP

Automate GitHub repository management, issue tracking, pull request workflows, branch operations, and CI/CD through Composio's GitHub toolkit.

## Prerequisites
- Rube MCP must be connected (`RUBE_SEARCH_TOOLS` available).
- Active GitHub connection via `RUBE_MANAGE_CONNECTIONS`.

## Core Workflows

### 1. Issues & PRs
- **Issues**: Create, list, and comment on issues. Note: `GITHUB_LIST_REPOSITORY_ISSUES` returns both issues and PRs.
- **Pull Requests**: Create, review, and merge PRs. Always verify mergeable status before merging.

### 2. Repositories & Branches
- **Repos**: Create user or org repositories.
- **Branches**: Create new references from SHAs. Use `GITHUB_GET_A_BRANCH` to resolve names to SHAs.

### 3. Search & Code
- **Search Code**: Search file contents (files <384KB on default branch).
- **Search Commits**: Requires keywords alongside qualifiers.

### 4. CI/CD & Deployments
- **Actions**: List workflows and trigger `workflow_dispatch` events.
- **Checks**: Verify CI status with `GITHUB_LIST_CHECK_RUNS_FOR_A_REF`.

## Best Practices
- **Safety**: Require explicit user confirmation for destructive operations (merge, delete).
- **Pagination**: Iterate until response returns fewer results than `per_page` (max 100).
- **ID Resolution**: List resources first to resolve names to numeric IDs or SHAs.

## Resources
- **docs/issue-workflow.md**: Detailed sequence for issue management.
- **docs/pr-review-guide.md**: Checklist for PR review and merging via tools.
