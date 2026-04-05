---
name: mcp-builder-ms
description: "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Covers Microsoft/Azure ecosystem."
risk: safe
source: community
date_added: "2026-03-11"
---

# MCP Server Development Guide

Create MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools.

## Microsoft MCP Ecosystem

### Available Servers
- **Azure MCP**: 48+ services (Storage, KeyVault, Cosmos, etc.).
- **Foundry MCP**: Models, deployments, and agents (`https://mcp.ai.azure.com`).
- **Playwright MCP**: Browser automation.
- **GitHub MCP**: GitHub Copilot integration.

## Development Workflow

### Phase 1: Planning
- **Workflow Tools**: Balance API coverage with specialized task-oriented tools.
- **Naming**: Use clear, descriptive prefixes (e.g., `github_create_issue`).
- **Context**: Design for concise descriptions and efficient pagination.

### Phase 2: Implementation (SDKs)
- **TypeScript**: Official `@modelcontextprotocol/sdk` (Recommended).
- **Python**: `mcp` (FastMCP).
- **C#/.NET**: `Microsoft.Mcp.Core`.

### Phase 3: Tool Design
- **Input Schema**: Use Zod (TS) or Pydantic (Python) for strict validation.
- **Output Schema**: Provide structured data where possible.
- **Hints**: Use `readOnlyHint`, `destructiveHint`, and `idempotentHint`.

### Phase 4: Evaluations
- Create 10+ complex, realistic, and verifiable QA pairs in XML format.
- Ensure tests are read-only and independent.

## Best Practices
- **Safety**: Minimal permissions and explicit destructive action guards.
- **Discoverability**: High-quality descriptions that guide the LLM.
- **Error Handling**: Actionable messages with clear next steps.

## Resources
- **docs/best-practices.md**: Universal MCP guidelines.
- **docs/mcp-patterns.md**: C#/.NET and Azure specific patterns.
- **examples/server-template.ts**: Boilerplate for TypeScript MCP servers.
