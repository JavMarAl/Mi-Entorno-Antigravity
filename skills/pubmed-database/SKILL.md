---
name: pubmed-database
description: "Direct REST API access to PubMed. Advanced Boolean/MeSH queries, E-utilities API, batch processing, citation management."
risk: safe
source: community
date_added: "2026-03-11"
---

# PubMed Database

Bio-medical literature database access via NCBI E-utilities.

## Core Capabilities

### 1. Advanced Search Query
Construct sophisticated queries using Boolean operators, field tags, and MeSH terms.
- **Boolean**: `AND`, `OR`, `NOT`.
- **Field Tags**: `[au]` (Author), `[ti]` (Title), `[ab]` (Abstract), `[mh]` (MeSH Terms), `[pt]` (Publication Type).
- **Date Filtering**: `2023:2024[dp]`.

### 2. MeSH Terms
Use Medical Subject Headings for precise searching.
- Use `[mh]` for automatic explosion of narrower terms.
- Combine with subheadings: `diabetes mellitus/therapy[mh]`.

### 3. Programmatic Access (E-utilities)
NCBI REST API for bulk data retrieval.
- **ESearch**: Retrieve PMIDs matching a query.
- **EFetch**: Download full records/abstracts in XML, JSON, or text.
- **Rate Limits**: 3 req/sec (public), 10 req/sec (with API key).

## Common Queries
- **Clinical Trials**: `topic AND randomized controlled trial[pt]`.
- **Systematic Reviews**: `topic AND systematic review[pt]`.
- **Free Full Text**: `topic AND free full text[sb]`.

## Resources
- **references/api_reference.md**: Detailed endpoint and parameter documentation.
- **references/search_syntax.md**: Comprehensive guide to field tags and operators.
- **references/common_queries.md**: Templates for disease-specific and methodological searches.
