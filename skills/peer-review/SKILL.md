---
name: peer-review
description: Structured manuscript/grant review with checklist-based evaluation. Use when writing formal peer reviews with specific criteria methodology assessment, statistical validity, reporting standards compliance (CONSORT/STROBE), and constructive feedback. Best for actual review writing, manuscript revision. For evaluating claims/evidence quality use scientific-critical-thinking; for quantitative scoring frameworks use scholar-evaluation.
allowed-tools: Read Write Edit Bash
license: MIT license
metadata:
    skill-author: K-Dense Inc.
---

# Scientific Critical Evaluation and Peer Review

## Overview

Peer review is a systematic process for evaluating scientific manuscripts. Assess methodology, statistics, design, reproducibility, ethics, and reporting standards. Apply this skill for manuscript and grant review across disciplines with constructive, rigorous evaluation.

## When to Use This Skill

- Conducting peer review of scientific manuscripts for journals
- Evaluating grant proposals and research applications
- Assessing methodology and experimental design rigor
- Reviewing statistical analyses and reporting standards
- Evaluating reproducibility and data availability
- Checking compliance with reporting guidelines (CONSORT, STROBE, PRISMA)
- Providing constructive feedback on scientific writing

## Peer Review Workflow

### Stage 1: Initial Assessment
- What is the central research question or hypothesis?
- Is the work scientifically sound and significant?
- Is there any immediate major flaw that would preclude publication?

### Stage 2: Section-by-Section Review

**Abstract & Title:** Accuracy, clarity, completeness, accessibility

**Introduction:** Context, rationale, novelty, literature, objectives

**Methods:** Reproducibility, rigor, ethics, statistics, validation
- Critical elements: sample sizes, power calculations, randomization, blinding, inclusion/exclusion criteria, software versions

**Results:** Presentation, statistics, objectivity, completeness
- Common issues: selective reporting, inappropriate tests, missing error bars, missing controls

**Discussion:** Interpretation, limitations, context, speculation, significance
- Red flags: overstated conclusions, causal claims from correlational data, inadequate limitations

**References:** Completeness, currency, balance, accuracy

### Stage 3: Statistical and Methodological Rigor

- Statistical assumptions met (normality, independence)?
- Effect sizes reported alongside p-values?
- Multiple testing correction applied?
- Confidence intervals provided?
- Power analysis justification?
- Exploratory vs. confirmatory analyses distinguished?
- Computational methods described, code available?

### Stage 4: Reproducibility and Transparency

- Raw data deposited in appropriate repositories?
- Analysis code available (GitHub, Zenodo)?
- Reporting guidelines followed (CONSORT, PRISMA, ARRIVE)?
- See `references/reporting_standards.md` for common guidelines

### Stage 5: Figure and Data Presentation

- Figures high-resolution, clearly labeled?
- Axes labeled with units?
- Error bars defined (SD, SEM, CI)?
- Colors colorblind-friendly?
- Signs of image manipulation?

### Stage 6: Ethical Considerations

- IRB/ethics approval documented?
- Informed consent described?
- IACUC approval for animal research?
- Competing interests and funding disclosed?

### Stage 7: Writing Quality

- Clear, precise, concise language?
- Logical organization and flow?
- Accessible to non-specialists?

## Peer Review Report Structure

### Summary Statement (1-2 paragraphs)
- Brief synopsis of the research
- Overall recommendation (accept/minor/major revisions/reject)
- Key strengths (2-3 bullets)
- Key weaknesses (2-3 bullets)

### Major Comments (numbered)
Each must include: issue → why problematic → specific solution

### Minor Comments (numbered)
Each must include: location → issue → suggested fix

### Questions for Authors
Specific clarifications needed on methods, contradictions, or missing data.

## Tone and Approach

**Do:** Be constructive, specific, balanced, respectful, thorough, clear

**Avoid:** Personal attacks, vague criticism, sarcasm, excessive experiment requests, revealing identity in double-blind review

## Special Considerations by Manuscript Type

| Type | Key Focus |
|------|-----------|
| Original research | Rigor, reproducibility, novelty |
| Reviews/meta-analyses | Search comprehensiveness, systematic approach, bias |
| Methods papers | Validation, comparison to existing methods, availability |
| Short reports | Brevity appropriate to findings |

## Presentations: Image-Based Review (MANDATORY)

**⚠️ NEVER read presentation PDFs directly — always convert to images first.**

```bash
python skills/scientific-slides/scripts/pdf_to_images.py presentation.pdf review/slide --dpi 150
# Creates: review/slide-001.jpg, review/slide-002.jpg, etc.
```

Then inspect EACH slide image sequentially and document issues by slide number.

**Presentation checklist:**
- [ ] Text ≥18pt, ideally ≥24pt
- [ ] High contrast (4.5:1 minimum)
- [ ] No text overflow or element overlaps
- [ ] ≤6 bullets per slide, ≤7 words per bullet
- [ ] Results dominate (40-50% of content)
- [ ] ~1 slide per minute of talk time
- [ ] Citations present (intro: 3-5 papers, discussion: 3-5 papers)

## Resources

- `references/reporting_standards.md` — CONSORT, PRISMA, ARRIVE, STROBE and other guidelines
- `references/common_issues.md` — Catalog of frequent methodological and statistical issues

## Final Checklist

- [ ] Summary clearly conveys overall assessment
- [ ] Major concerns identified and justified
- [ ] Revisions are specific and actionable
- [ ] Statistical methods evaluated
- [ ] Reproducibility and data availability assessed
- [ ] Ethical considerations verified
- [ ] Figures evaluated for quality and integrity
- [ ] Tone is constructive and professional
- [ ] Recommendation consistent with identified issues
