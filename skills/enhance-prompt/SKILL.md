---
name: enhance-prompt
description: Transforms vague UI ideas into polished, Stitch-optimized prompts. Enhances specificity, adds UI/UX keywords, injects design system context, and structures output for better generation results.
risk: safe
source: community
date_added: "2026-03-11"
---

# Enhance Prompt for Stitch

Transform rough or vague UI generation ideas into polished, optimized prompts that produce better results from Stitch.

## Prerequisites

Consult the official Stitch documentation for the latest best practices:
- **Stitch Effective Prompting Guide**: https://stitch.withgoogle.com/docs/learn/prompting/

## Enhancement Pipeline

### Step 1: Assess the Input
Evaluate missing platform, page type, structure, visual style, colors, and specific components.

### Step 2: Check for DESIGN.md
Extract design system blocks from `DESIGN.md` if available. If not, add a tip to create one using the `design-md` skill.

### Step 3: Apply Enhancements
- **UI/UX Keywords**: Replace "menu" with "navigation bar", "button" with "primary CTA", etc.
- **Amplify Vibe**: Add descriptors like "clean, minimal, minimal whitespace" or "sophisticated, trustworthy".
- **Structure**: Organize into Header, Hero, Content Area, and Footer.
- **Colors**: Format as `Descriptive Name (#hexcode) for functional role`.

### Step 4: Format Output
Return a structured prompt including a "DESIGN SYSTEM (REQUIRED)" section and a numbered "Page Structure".

## Examples

- **Vague**: "make me a login page" -> **Enhanced**: A clean, trustworthy login page with centered form, specific hex colors, and card elevation.
- **Feature**: "add a search bar" -> **Enhanced**: Specific targeted edit for a pill-shaped input with magnifying glass icon in the header.

## Tips
- Match user intent (don't over-design).
- Use `next-prompt.md` for integration with `stitch-loop`.
- One change at a time for targeted edits.
