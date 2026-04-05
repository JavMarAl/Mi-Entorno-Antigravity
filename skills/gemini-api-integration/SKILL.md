---
name: gemini-api-integration
description: "Use when integrating Google Gemini API into projects. Covers model selection, multimodal inputs, streaming, function calling, and production best practices."
risk: safe
source: community
date_added: "2026-03-11"
---

# Gemini API Integration

## Overview
Guides the integration of Google Gemini API into applications, from basic text generation to advanced multimodal and tool-use patterns.

## When to Use
- Initial Gemini SDK setup (Node.js, Python).
- Implementing multimodal features (Text + Image/Audio/Video).
- Adding streaming for low latency.
- Setting up Function Calling / Tool Use.
- Optimizing model selection (Flash vs Pro).

## Core Capabilities

### 1. Model Selection
- **gemini-1.5-flash**: Best for speed and cost.
- **gemini-1.5-pro**: Best for complex reasoning and long context.
- **gemini-2.0-flash**: Latest multimodal excellence.

### 2. Implementation Patterns
- **Streaming**: Iterate over `result.stream` for real-time UI.
- **Multimodal**: Use `inlineData` for small files, File API for files >20MB.
- **Function Calling**: Define `functionDeclarations` and handle `functionCalls()`.
- **System Instructions**: Set persistent personas via `systemInstruction`.

### 3. Production Best Practices
- **Security**: Store API keys in environment variables.
- **Reliability**: Implement exponential backoff for 429 errors.
- **Safety**: Check `blockReason` in prompt feedback.
- **Efficiency**: Stream by default for chat interfaces.

## Troubleshooting
- **API_KEY_INVALID**: Check environment variables and AI Studio status.
- **RESOURCE_EXHAUSTED**: Implementation request queuing/backoff.
- **Safety Blocks**: Adjust prompt or safety settings based on feedback.

## Resources
- **examples/node-example.js**: SDK patterns for TypeScript/Node.js.
- **examples/python-example.py**: Integration patterns for Python.
- **docs/model-selection-guide.md**: Detailed cost/performance comparison.
