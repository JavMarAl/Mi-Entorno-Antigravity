---
name: grafana-dashboards
description: "Create and manage production Grafana dashboards for real-time visualization of system and application metrics."
risk: safe
source: community
date_added: "2026-03-11"
---

# Grafana Dashboards

Design and manage production-ready Grafana dashboards for comprehensive system observability using industry-standard methodologies.

## Design Principles

### 1. Hierarchy of Information
- **Critical Metrics**: Big numbers for high-level health.
- **Key Trends**: Time series for historical context.
- **Detailed Metrics**: Tables and heatmaps for deep dives.

### 2. Methodologies
- **RED Method (Services)**: Rate, Errors, Duration.
- **USE Method (Resources)**: Utilization, Saturation, Errors.

## Core Capabilities

### 1. Panel Types
- **Stat Panel**: Single values with thresholds (Green/Yellow/Red).
- **Time Series**: Standard trend visualization.
- **Table**: Instant status reporting with transformations.
- **Heatmap**: Latency distribution visualization.

### 2. Variables & Templating
- Use query variables for dynamic filtering (e.g., `$namespace`, `$service`).
- Implement `$__interval` for responsive data resolution.

### 3. Alerting
- Configure conditions and thresholds directly in dashboards.
- Set up notification channels (Slack, PagerDuty).

### 4. Dashboard as Code
- Provision via Terraform or Ansible.
- Manage configuration files in JSON format.

## Best Practices
- **Templates**: Start with community dashboard IDs.
- **Units**: Configure bytes, seconds, percentages correctly.
- **Consistency**: Use uniform color schemes across different dashboards.
- **Descriptions**: Add context to help operators understand "What am I looking at?".

## Resources
- **assets/api-dashboard.json**: Reference JSON for API monitoring.
- **assets/infrastructure-dashboard.json**: Node/Pod monitoring template.
- **references/dashboard-design.md**: Visual guide for layout best practices.
