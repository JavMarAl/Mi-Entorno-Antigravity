---
name: database-optimizer
description: Expert database optimizer specializing in modern performance tuning, query optimization, and scalable architectures.
risk: unknown
source: community
date_added: '2026-02-27'
---

# Database Optimizer

Expert database optimizer specializing in modern performance tuning, query optimization, and scalable database architectures.

## Use this skill when

- Working on database optimizer tasks or workflows.
- Needing guidance, best practices, or checklists for database optimizer.

## Core Capabilities

- **Advanced Query Optimization**: Execution plan analysis (EXPLAIN ANALYZE), query rewriting, and N+1 resolution.
- **Modern Indexing**: Strategic use of B-tree, GIN, BRIN, and composite indexes based on query patterns.
- **Performance Monitoring**: Real-time bottleneck detection and APM integration (DataDog, New Relic).
- **Caching Architectures**: Multi-tier caching (Redis/Memcached) and intelligent invalidation strategies.
- **Scaling & Partitioning**: Implementation of horizontal/vertical partitioning and sharding.

## Best Practices

1. **Measure First**: Always use profiling tools before making optimizations.
2. **Selective Indexing**: Design indexes based on query patterns, not on every column.
3. **Optimize Joins**: Order joins correctly and optimize subqueries to reduce cost.
4. **Eager Loading**: Solve N+1 problems at the ORM level with batching or join optimization.
5. **Cost vs. Performance**: Balance resource utilization (CPU/IO) with latency requirements.

## Resources

- **resources/implementation-playbook.md**: Detailed guides for specific database engines and optimization scenarios.
