---
name: design-md
description: "Analyze Stitch projects and synthesize a semantic design system into DESIGN.md files"
risk: safe
source: "https://github.com/google-labs-code/stitch-skills/tree/main/skills/design-md"
date_added: "2026-02-27"
---

# Stitch DESIGN.md Skill

Expert Design Systems Lead. Goal: analyze Stitch technical assets (HTML/CSS/Metadata) and synthesize a "Semantic Design System" into a `DESIGN.md` file.

## Use this Skill when

- Analyzing Stitch projects.
- Creating `DESIGN.md` files.
- Synthesizing semantic design systems for consistent screen generation.

## Analysis Workflow

1. **Namespace Discovery**: Find the Stitch MCP prefix (e.g., `mcp_stitch:`).
2. **Project/Screen Lookup**: Retrieve Project and Screen IDs via `list_projects` and `list_screens`.
3. **Metadata & Code Fetch**: Use `get_screen` to obtain `screenshot.downloadUrl` and `htmlCode.downloadUrl`.
4. **Synthesis**:
   - **Atmosphere**: Describe the "vibe" (Minimalist, Airy, Utilitarian).
   - **Color Palette**: Map Descriptive Names + Hex Codes + Functional Roles.
   - **Geometry**: Translate technical values (rounded-lg) into physical descriptions (Subtly rounded).
   - **Elevation**: Describe shadows and depth quality.

## DESIGN.md Structure

```markdown
# Design System: [Project Title]
**Project ID:** [ID]

## 1. Visual Theme & Atmosphere
## 2. Color Palette & Roles
## 3. Typography Rules
## 4. Component Stylings
## 5. Layout Principles
```

## Best Practices

- **Be Descriptive**: Use natural language ("Ocean-deep Cerulean") besides hex codes.
- **Explain "Why"**: Document the functional role of design choices.
- **Reference Prompting Guide**: Align language with the [Stitch Effective Prompting Guide](https://stitch.withgoogle.com/docs/learn/prompting/).
