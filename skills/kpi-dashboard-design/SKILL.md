---
name: kpi-dashboard-design
description: "Design effective KPI dashboards with metrics selection, visualization best practices, and real-time monitoring patterns."
risk: safe
source: community
date_added: "2026-03-11"
---

# KPI Dashboard Design

Comprehensive patterns for designing effective Key Performance Indicator (KPI) dashboards that drive business decisions.

## Core Frameworks

### 1. KPI Hierarchy
- **Strategic**: Long-term goals for Executives (Monthly/Quarterly).
- **Tactical**: Department goals for Managers (Weekly/Monthly).
- **Operational**: Day-to-day for Teams (Real-time/Daily).

### 2. SMART Metrics
- **Specific**: Clear definition.
- **Measurable**: Quantifiable.
- **Achievable**: Realistic targets.
- **Relevant**: Aligned to goals.
- **Time-bound**: Defined period.

## Layout Patterns

### Executive Summary
- 4-6 headline KPIs with trend indicators.
- High-level charts (Revenue vs Profit, Customer Acquisition).
- Critical alerts and warnings.

### SaaS Metrics
- Focus on MRR, ARR, Churn, and Unit Economics (CAC, LTV).
- Cohort retention heatmaps.

### Operations Center
- Real-time system health (CPU, MEM, DISK).
- Service status and request throughput.
- Error rates and circuit breaker status.

## Implementation Examples

### SQL for Business Intel
- Calculation of MRR growth and monthly trends.
- Cohort analysis and retention rate tracking.
- Customer Acquisition Cost (CAC) attribution.

### Python (Streamlit/Plotly)
- Metric cards with delta indicators.
- Interactive line charts for trends.
- Heatmaps for user retention.

## Best Practices
- **Limit**: Focus on 5-7 meaningful KPIs.
- **Context**: Always show trends, targets, or comparisons.
- **Color**: Consistent use (Red=Bad, Green=Good).
- **Mobile**: Ensure responsive design for executive consumption.

## Resources
- **assets/executive-summary.json**: Layout template for executive views.
- **assets/saas-metrics.json**: Dataset structure for SaaS metrics.
- **resources/implementation-playbook.md**: Detailed guides for SQL/Python integration.
