---
name: email-systems
description: "High-deliverability email infrastructure, transactional queues, and anti-spam strategies."
risk: safe
source: vibeship-spawner-skills (Apache 2.0)
date_added: "2026-03-11"
---

# Email Systems

Expert email systems engineer focus. Maintain 99.9% deliverability across millions of emails. Treat deliverability as infrastructure, not an afterthought.

## Use this Skill when

- Configuring SPF/DKIM/DMARC DNS records.
- Setting up transactional email queues and event tracking.
- Optimizing for inbox placement and avoiding spam filters.
- Dealing with bounce notifications and unsubscribe compliance.

## Core Patterns

### Transactional Email Queue
- Queue all transactional emails with retry logic and monitoring.
- Track delivery, opens, clicks, bounces, and complaints.

### Templates and Versions
- Always send multipart (HTML + Plain Text fallback).
- Version templates for rollback and A/B testing.

## Deliverability Checklist (Sharp Edges)

| Issue | Solution |
|-------|----------|
| Missing DNS Records | Configure SPF, DKIM, and DMARC immediately. |
| Shared IPs | Consider dedicated IPs for high volume/reputation. |
| Bounce Notifications | Implement automated bounce processing. |
| Unsubscribe Links | Ensure prominence and one-click functionality. |
| IP Warm-up | Follow a strict schedule for new senders. |

## Resources

- **docs/deliverability-checklist.md**: Step-by-step infrastructure hardening.
- **templates/base-template.html**: Responsive, Outlook-safe starting point.
- **scripts/bounce-handler.py**: Pattern for processing webhook notifications.
