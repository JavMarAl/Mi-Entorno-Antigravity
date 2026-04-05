---
name: postgresql-optimization
description: "PostgreSQL database optimization workflow for query tuning, indexing strategies, performance analysis, and production database management."
category: granular-workflow-bundle
risk: safe
source: personal
date_added: "2026-03-11"
---

# PostgreSQL Optimization Workflow

Specialized workflow for PostgreSQL database optimization including query tuning, indexing strategies, performance analysis, vacuum management, and production database administration.

## Workflow Phases

### Phase 1: Performance Assessment
Identify bottlenecks and review configuration.
- **Skills**: `database-optimizer`, `postgres-best-practices`
- **Actions**: Analyze slow queries, check resource usage, review `postgresql.conf`.

### Phase 2: Query Analysis
Deep dive into execution plans.
- **Skills**: `sql-optimization-patterns`, `postgres-best-practices`
- **Actions**: Run `EXPLAIN ANALYZE`, identify scan types (Seq Scan vs Index Scan).

### Phase 3: Indexing Strategy
Design and implement effective indexes.
- **Skills**: `database-design`, `postgresql`
- **Actions**: Create B-tree, composite, and partial indexes based on query needs.

### Phase 4: Query Optimization
Rewrite and refactor SQL.
- **Skills**: `sql-optimization-patterns`, `sql-pro`
- **Actions**: Rewriting joins, adding CTEs, implementing efficient pagination.

### Phase 5: Configuration Tuning
Optimize Postgres engine parameters.
- **Skills**: `postgres-best-practices`, `database-admin`
- **Actions**: Tune `shared_buffers`, `work_mem`, `effective_cache_size`, and autovacuum settings.

### Phase 6: Maintenance
Ensure long-term database health.
- **Skills**: `database-admin`, `postgresql`
- **Actions**: Schedule `VACUUM`, analyze bloat, and monitor statistics.

### Phase 7: Monitoring
Visualizing performance and setting alerts.
- **Skills**: `grafana-dashboards`, `prometheus-configuration`
- **Actions**: Create custom dashboards and configure proactive alerting.

## Optimization Checklist
- [ ] Slow queries identified and logged.
- [ ] Indexes optimized for production workloads.
- [ ] Engine configuration tuned for hardware.
- [ ] Maintenance tasks automated and verified.
- [ ] Real-time monitoring active with alerts.

## Resources
- **prompts/**: Copy-paste prompts for each phase.
- **checklists/**: Detailed verification steps for database health.
