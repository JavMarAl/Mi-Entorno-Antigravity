---
name: canva-automation
description: "Automate Canva tasks via Rube MCP (Composio): designs, exports, folders, brand templates, autofill. Always search tools first for current schemas."
risk: unknown
source: community
date_added: "2026-02-27"
---

# Canva Automation via Rube MCP

Automate Canva design operations through Composio's Canva toolkit via Rube MCP.

## Prerequisites

- Rube MCP must be connected (RUBE_SEARCH_TOOLS available)
- Active Canva connection via `RUBE_MANAGE_CONNECTIONS` with toolkit `canva`
- Always call `RUBE_SEARCH_TOOLS` first to get current tool schemas

## Setup

**Get Rube MCP**: Add `https://rube.app/mcp` as an MCP server in your client configuration. No API keys needed — just add the endpoint and it works.

1. Verify Rube MCP is available by confirming `RUBE_SEARCH_TOOLS` responds.
2. Call `RUBE_MANAGE_CONNECTIONS` with toolkit `canva`.
3. If connection is not ACTIVE, follow the returned auth link to complete Canva OAuth.
4. Confirm connection status shows ACTIVE before running any workflows.

## Core Workflows

### 1. List and Browse Designs
- `CANVA_LIST_USER_DESIGNS`: Search and filter based on `query`, `ownership`, and `sort_by`.
- Handle `continuation` tokens for pagination.

### 2. Create and Design
- `CANVA_CREATE_CANVA_DESIGN_WITH_OPTIONAL_ASSET`: Use predefined `design_type` or custom dimensions.
- Assets must be uploaded before referencing.

### 3. Upload Assets
- `CANVA_CREATE_ASSET_UPLOAD_JOB`: Start upload.
- `CANVA_FETCH_ASSET_UPLOAD_JOB_STATUS`: Poll until status is 'success'.

### 4. Export Designs
- `CANVA_CREATE_CANVA_DESIGN_EXPORT_JOB`: Choose format (PDF, PNG, etc.) and quality.
- `CANVA_GET_DESIGN_EXPORT_JOB_RESULT`: Poll for the final download URL.

### 5. Organize with Folders
- `CANVA_POST_FOLDERS`: Create structured organization.
- `CANVA_MOVE_ITEM_TO_SPECIFIED_FOLDER`: Manage library.

### 6. Autofill from Brand Templates
- `CANVA_ACCESS_USER_SPECIFIC_BRAND_TEMPLATES_LIST`: Find template ID.
- `CANVA_INITIATE_CANVA_DESIGN_AUTOFILL_JOB`: Pass data mapping for placeholders.

## Common Patterns

### Async Job Pattern
Many Canva operations (upload, export, autofill) are asynchronous.
1. Initiate job -> get `job_id`.
2. Poll status endpoint every 2-3 seconds.
3. On 'success', extract result.

## Known Pitfalls
- **URLs Expire**: Export download URLs should be used promptly.
- **Strict Matching**: Template placeholders are case-sensitive.
- **Rate Limits**: Apply exponential backoff for bulk operations.
