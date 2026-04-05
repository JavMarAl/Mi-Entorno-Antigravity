---
name: differential-review
description: >
  Performs security-focused differential review of code changes (PRs, commits, diffs).
  Adapts analysis depth to codebase size, uses git history for context, calculates
  blast radius, checks test coverage, and generates comprehensive markdown reports.
---

# Differential Security Review

Security-focused code review for PRs, commits, and diffs.

## Core Principles

1. **Risk-First**: Focus on auth, crypto, value transfer, external calls.
2. **Evidence-Based**: Every finding backed by git history, line numbers, attack scenarios.
3. **Adaptive**: Scale to codebase size (SMALL/MEDIUM/LARGE).
4. **Honest**: Explicitly state coverage limits and confidence level.
5. **Output-Driven**: Always generate comprehensive markdown report file.

## Workflow Overview

```
Pre-Analysis → Phase 0: Triage → Phase 1: Code Analysis → Phase 2: Test Coverage
    ↓              ↓                    ↓                        ↓
Phase 3: Blast Radius → Phase 4: Deep Context → Phase 5: Adversarial → Phase 6: Report
```

## Quick Reference: Risk Level Triggers

| Risk Level | Triggers |
|------------|----------|
| HIGH | Auth, crypto, external calls, value transfer, validation removal |
| MEDIUM | Business logic, state changes, new public APIs |
| LOW | Comments, tests, UI, logging |

## Supporting Documentation

- **docs/methodology.md**: Detailed phase-by-phase workflow (Phases 0-4).
- **docs/adversarial.md**: Attacker modeling and exploit scenarios (Phase 5).
- **docs/reporting.md**: Report structure and formatting (Phase 6).
- **docs/patterns.md**: Common vulnerability patterns reference.

## Quality Checklist

- [ ] All changed files analyzed.
- [ ] Git blame on removed security code.
- [ ] Blast radius calculated for HIGH risk.
- [ ] Attack scenarios are concrete (not generic).
- [ ] Report file generated.
