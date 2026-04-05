---
name: dropbox-automation
description: "Automate Dropbox file management, sharing, search, uploads, downloads, and folder operations via Rube MCP (Composio)."
risk: unknown
source: community
date_added: "2026-03-11"
---

# Dropbox Automation via Rube MCP

Automate Dropbox operations including file upload/download, search, folder management, sharing links, batch operations, and metadata retrieval through Composio's Dropbox toolkit via Rube MCP.

## Prerequisites

- Rube MCP must be connected.
- Active Dropbox connection via `RUBE_MANAGE_CONNECTIONS` with toolkit `dropbox`.
- Always call `RUBE_SEARCH_TOOLS` first to get current tool schemas.

## Setup

1. Verify Rube MCP: Confirm `RUBE_SEARCH_TOOLS` responds.
2. Manage Connections: Call `RUBE_MANAGE_CONNECTIONS` with toolkit `dropbox`.
3. OAuth: Follow the auth link if connection is not ACTIVE.

## Core Workflows

### 1. Search for Files and Folders
- **Tool**: `DROPBOX_SEARCH_FILE_OR_FOLDER`
- **Pagination**: Use `DROPBOX_SEARCH_CONTINUE` if `has_more: true`.

### 2. Upload and Download
- **Upload**: `DROPBOX_UPLOAD_FILE` (supports `add` or `overwrite`).
- **Download**: `DROPBOX_READ_FILE`.
- **Zip**: `DROPBOX_DOWNLOAD_ZIP` for folder downloads.

### 3. Sharing
- **Create**: `DROPBOX_CREATE_SHARED_LINK`.
- **Pre-check**: Always call `DROPBOX_LIST_SHARED_LINKS` first to avoid 409 Conflict.

### 4. Folder Management (Batch)
- **Batch Ops**: `DROPBOX_MOVE_BATCH`, `DROPBOX_DELETE_BATCH`, `DROPBOX_CREATE_FOLDER_BATCH`.
- **Polling**: Check async status via `DROPBOX_CHECK_MOVE_BATCH` or `DROPBOX_CHECK_FOLDER_BATCH`.

## Pitfalls & Tips

- **Paths**: Must start with `/` (except root `""`), case-sensitive, no trailing `/`.
- **Async**: Batch operations and `SAVE_URL` are asynchronous; job IDs must be polled.
- **Base64**: `DROPBOX_READ_FILE` content might be base64-encoded.

## Resources

- **docs/setup-guide.md**: Detailed connection and OAuth instructions.
- **docs/tool-schemas.md**: Reference for current tool inputs and outputs.
