---
name: mcp-builder
description: "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools."
risk: safe
source: community
date_added: "2026-03-11"
---

# MCP Server Development Guide

Create MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools.

## Recommended Stack
- **Language**: TypeScript (preferred for SDK support, static typing, and execution environment compatibility).
- **Transport**:
  - **Streamable HTTP**: For remote, multi-tenant, and scalable servers.
  - **stdio**: For local development and single-user desktop applications.

## Development Workflow

### Phase 1: Planning
- **Workflow Tools**: Balance API coverage with specialized task-oriented tools.
- **Naming**: Use clear, descriptive, action-oriented names with consistent prefixes.
- **Discoverability**: High-quality descriptions that help agents find and use tools correctly.

### Phase 2: Implementation
- **Core Infrastructure**: Implement API clients (with auth), error handlers, and response formatters (JSON/Markdown).
- **Tool Registration**: Use language-specific SDKs (TypeScript `@modelcontextprotocol/sdk` or Python `mcp/FastMCP`).
- **Validation**: Use Zod (TS) or Pydantic (Python) for input schemas.

### Phase 3: Quality and Testing
- **Error Messages**: Provide actionable advice and next steps in error responses.
- **Pagination**: Support filtering and pagination for large datasets.
- **Hints**: Annotate tools with `readOnlyHint`, `destructiveHint`, and `idempotentHint`.

### Phase 4: Evaluations
- Create 10+ complex, independent, and verifiable read-only evaluation questions.
- Verify answers manually before running automated tests.

## Reference Library
- **reference/mcp_best_practices.md**: Universal guidelines for tool naming and response formats.
- **reference/node_mcp_server.md**: TypeScript implementation patterns and examples.
- **reference/python_mcp_server.md**: Python/FastMCP implementation patterns and examples.
- **reference/evaluation.md**: Complete guide to creating and running MCP evaluations.

## Examples
- **examples/node-server-boilerplate.ts**: Start point for TypeScript servers.
- **examples/python-server-boilerplate.py**: Start point for Python servers.
