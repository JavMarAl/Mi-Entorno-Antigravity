---
name: paper-2-web
description: This skill should be used when converting academic papers into promotional and presentation formats including interactive websites (Paper2Web), presentation videos (Paper2Video), and conference posters (Paper2Poster). Use this skill for tasks involving paper dissemination, conference preparation, creating explorable academic homepages, generating video abstracts, or producing print-ready posters from LaTeX or PDF sources.
allowed-tools: Read Write Edit Bash
license: Unknown
metadata:
    skill-author: K-Dense Inc.
---

# Paper2All: Academic Paper Transformation Pipeline

## Overview

Transform academic papers (LaTeX or PDF) into three primary promotional formats:

1. **Paper2Web** — Interactive, explorable academic homepages
2. **Paper2Video** — Professional presentation videos with narration and slides
3. **Paper2Poster** — Print-ready conference posters

**Repository:** https://github.com/YuhangChen1/Paper2All

## When to Use This Skill

- Converting papers to interactive websites for preprint/post-publication promotion
- Generating conference posters and videos
- Creating video abstracts for journals or social media
- Disseminating findings via lab websites or institutional showcases

**Trigger phrases:** "convert this paper to a website", "generate a conference poster", "create a video presentation from this research"

## Quick Start

```bash
git clone https://github.com/YuhangChen1/Paper2All.git
cd Paper2All
conda create -n paper2all python=3.11 && conda activate paper2all
pip install -r requirements.txt
```

Create `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
# Optional: GOOGLE_API_KEY and GOOGLE_CSE_ID for logo search
```

## Usage

```bash
# Generate all components
python pipeline_all.py --input-dir "path/to/paper" --output-dir "output" --model-choice 1

# Website only
python pipeline_all.py --input-dir "path/to/paper" --output-dir "output" --generate-website

# Poster with custom size
python pipeline_all.py --input-dir "path/to/paper" --output-dir "output" \
  --generate-poster --poster-width-inches 60 --poster-height-inches 40

# Video (lightweight pipeline)
python pipeline_light.py --model_name_t gpt-4.1 --model_name_v gpt-4.1 \
  --result_dir "output" --paper_latex_root "path/to/paper"
```

## Input Formats

**Recommended:** LaTeX source directory:
```
paper_directory/
├── main.tex
├── figures/
└── bibliography.bib
```

**Alternative:** High-quality PDF with selectable text (300+ DPI figures preferred).

## Component Details

| Component | Time | Best For |
|-----------|------|----------|
| Paper2Web | 15-30 min | Online presence, preprints |
| Paper2Poster | 10-20 min | Physical conference sessions |
| Paper2Video | 20-60 min | Video abstracts, talks |
| Paper2Video + talking-head | 60-120 min | Personalized presentations |

## Output Structure

```
output/paper_name/
├── website/index.html + styles.css + assets/
├── poster/poster_final.pdf + poster_final.png
└── video/final_video.mp4 + slides/ + audio/
```

## API Costs (GPT-4, approximate)

| Component | Cost |
|-----------|------|
| Website | $0.50 – $2.00 |
| Poster | $0.30 – $1.00 |
| Video | $1.00 – $3.00 |
| Complete package | $2.00 – $6.00 |

## Visual Enhancement

Use the **scientific-schematics** skill to enhance output documents with AI-generated diagrams:

```bash
python scripts/generate_schematic.py "paper transformation pipeline" -o figures/workflow.png
```

## References

- `references/installation.md` — Full installation and configuration guide
- `references/paper2web.md` — Interactive website generation details
- `references/paper2video.md` — Video generation including talking-head setup
- `references/paper2poster.md` — Poster design templates and parameters
- `references/usage_examples.md` — Real-world workflow examples
