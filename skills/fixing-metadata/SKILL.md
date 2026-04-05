---
name: fixing-metadata
description: >
  Audit and fix HTML metadata including page titles, meta descriptions, canonical URLs, Open Graph
  tags, Twitter cards, favicons, JSON-LD structured data, and robots directives.
risk: safe
source: community
date_added: "2026-03-11"
---

# Fixing Metadata Skill

Audit and fix HTML metadata to ensure pages are correctly indexed, shareable, and optimized for SEO. This skill covers titles, descriptions, social cards, icons, and structured data.

## Workflow

1. **Identify Issues**: Find missing/incorrect titles, descriptions, canonicals, or OG tags.
2. **Prioritize**: Fix critical correctness/duplication issues first.
3. **Align**: Ensure title, description, canonical, and `og:url` are consistent.
4. **Verify**: Test social previews (ensure absolute URLs are used).
5. **Scoped Diffs**: Keep changes minimal and focused on `<head>` or metadata APIs.

## When to Use

- Adding/changing SEO metadata (titles, descriptions, canonicals).
- Implementing Open Graph or Twitter cards.
- Setting favicons, app icons, mask-icons, or manifests.
- Adding JSON-LD structured data.
- Handling localization/locale metadata (`hreflang`, `og:locale`).

## Rule Categories (Priority)

1. **Correctness & Duplication** (Critical): No duplicate tags, deterministic values.
2. **Title & Description** (High): Every page needs a readable title and description.
3. **Canonical & Indexing** (High): Correct `canonical` and `robots` directives.
4. **Social Cards** (High): `og:title`, `og:description`, absolute image URLs.
5. **Icons & Manifest** (Medium): Favicon, apple-touch-icon, web manifest.
6. **Structured Data** (Medium): Valid JSON-LD matching page content.
7. **Locale & Alternates** (Low): `lang` attribute and `hreflang` tags.

## Best Practices

- Use absolute URLs for all canonical and social metadata.
- Prefer existing project patterns (e.g., Next.js Metadata API, React Helmet).
- Never "refactor" unrelated code while fixing metadata.
- Previews/staging should be `noindex` by default.

## Resources

- **docs/seo-checklist.md**: Priority-based audit checklist.
- **docs/og-tags-sample.html**: Reference for correct Open Graph and Twitter Card structure.
