---
name: postgres-best-practices
description: "Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations."
risk: safe
source: community
date_added: "2026-03-11"
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## Usage
- **Query Writing**: Reference `rules/query-*.md` for indexing and join optimizations.
- **Schema Design**: Reference `rules/schema-*.md` for data types and partitioning.
- **Security**: Reference `rules/security-*.md` for Row-Level Security (RLS) policies.
- **Connection**: Reference `rules/conn-*.md` for pooling and session management.

## Rule Structure
Each rule in the `rules/` directory contains:
- **Impact**: Criticality of the optimization.
- **Problem**: Incorrect SQL/Design.
- **Solution**: Correct SQL/Design with explanation.
- **Verification**: How to confirm the fix using `EXPLAIN ANALYZE`.

## Full Guide
Refer to `AGENTS.md` for the compiled set of all rules and patterns.
