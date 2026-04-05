---
name: infographics
description: "Create professional infographics using Nano Banana Pro AI with smart iterative refinement. Uses Gemini 3 Pro for quality review. Integrates research-lookup and web search for accurate data. Supports 10 infographic types, 8 industry styles, and colorblind-safe palettes."
allowed-tools: Read Write Edit Bash
---

# Infographics

## Overview

Infographics are visual representations of information, data, or knowledge designed to present complex content quickly and clearly. **This skill uses Nano Banana Pro AI for infographic generation with Gemini 3 Pro quality review and Perplexity Sonar for research.**

**How it works:**
- (Optional) **Research phase**: Gather accurate facts and statistics using Perplexity Sonar
- Describe your infographic in natural language
- Nano Banana Pro generates publication-quality infographics automatically
- **Gemini 3 Pro reviews quality** against document-type thresholds
- **Smart iteration**: Only regenerates if quality is below threshold
- Professional-ready output in minutes

**Quality Thresholds by Document Type:**
| Document Type | Threshold | Description |
|---------------|-----------|-------------|
| marketing | 8.5/10 | Marketing materials - must be compelling |
| report | 8.0/10 | Business reports - professional quality |
| presentation | 7.5/10 | Slides, talks - clear and engaging |
| social | 7.0/10 | Social media content |
| internal | 7.0/10 | Internal use |
| draft | 6.5/10 | Working drafts |
| default | 7.5/10 | General purpose |

## Quick Start

```bash
# List infographic (default threshold 7.5/10)
python skills/infographics/scripts/generate_infographic.py \
  "5 benefits of regular exercise" \
  -o figures/exercise_benefits.png --type list

# Marketing (highest threshold: 8.5/10)
python skills/infographics/scripts/generate_infographic.py \
  "Product features comparison" \
  -o figures/product_comparison.png --type comparison --doc-type marketing

# With automatic research for accurate data
python skills/infographics/scripts/generate_infographic.py \
  "Global AI market size and growth projections" \
  -o figures/ai_market.png --type statistical --research
```

## Infographic Types (`--type`)

| Type | Best For |
|------|----------|
| `statistical` | Data, percentages, charts |
| `timeline` | History, milestones |
| `process` | Step-by-step workflows |
| `comparison` | Side-by-side options |
| `list` | Tips, key points |
| `geographic` | Regional/map data |
| `hierarchical` | Pyramid, org charts |
| `anatomical` | Visual metaphors |
| `resume` | Professional profiles |
| `social` | Social media posts |

## Style Presets (`--style`)

| Style | Best For |
|-------|----------|
| `corporate` | Business reports, finance |
| `healthcare` | Medical, wellness |
| `technology` | Software, data, AI |
| `nature` | Environmental, organic |
| `education` | Learning, academic |
| `marketing` | Social media, campaigns |
| `finance` | Investment, banking |
| `nonprofit` | Social causes |

## Colorblind-Safe Palettes (`--palette`)

| Palette | Description |
|---------|-------------|
| `wong` | Most widely recommended (orange, sky blue, green...) |
| `ibm` | IBM's accessible palette |
| `tol` | 12-color extended palette |

## Command-Line Reference

```bash
python skills/infographics/scripts/generate_infographic.py [OPTIONS] PROMPT

Options:
  -o, --output PATH         Output file path (required)
  -t, --type TYPE           Infographic type preset
  -s, --style STYLE         Industry style preset
  -p, --palette PALETTE     Colorblind-safe palette
  -b, --background COLOR    Background color (default: white)
  --doc-type TYPE           Document type for quality threshold
  --research                Enable Perplexity Sonar research phase
  --iterations N            Maximum refinement iterations (default: 3)
  --api-key KEY             OpenRouter API key
  -v, --verbose             Verbose output
  --list-options            List all available options
```

## Smart Iterative Refinement

Gemini 3 Pro evaluates each infographic on:
1. Visual Hierarchy & Layout
2. Typography & Readability
3. Data Visualization
4. Color & Accessibility
5. Overall Impact

Generates until quality threshold is met OR max iterations reached.

## Configuration

```bash
export OPENROUTER_API_KEY='your_api_key_here'
```

## Resources

- **`references/infographic_types.md`**: Extended templates for all 10+ types
- **`references/design_principles.md`**: Visual hierarchy, layout, typography
- **`references/color_palettes.md`**: Full palette specifications
- **`scripts/generate_infographic.py`**: Main generation script

## Integration

Works with: `scientific-schematics`, `market-research-reports`, `scientific-slides`, `generate-image`
