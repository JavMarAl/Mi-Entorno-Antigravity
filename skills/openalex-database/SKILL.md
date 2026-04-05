---
name: openalex-database
description: Query and analyze scholarly literature using the OpenAlex database. This skill should be used when searching for academic papers, analyzing research trends, finding works by authors or institutions, tracking citations, discovering open access publications, or conducting bibliometric analysis across 240M+ scholarly works. Use for literature searches, research output analysis, citation analysis, and academic database queries.
license: Unknown
metadata:
    skill-author: K-Dense Inc.
---

# OpenAlex Database

## Overview

OpenAlex is a comprehensive open catalog of 240M+ scholarly works, authors, institutions, topics, sources, publishers, and funders. No API key required — completely open and free.

**Rate Limits:**
- Default: 1 req/sec, 100k requests/day
- Polite pool (with email): 10 req/sec, 100k requests/day

## Quick Start

```bash
uv pip install requests
```

Always use email to access the polite pool (10x rate limit):
```python
from scripts.openalex_client import OpenAlexClient
client = OpenAlexClient(email="your-email@example.edu")
```

## Core Capabilities

### 1. Search for Papers
```python
results = client.search_works(
    search="CRISPR gene editing",
    filter_params={"publication_year": ">2020", "is_oa": "true"},
    sort="cited_by_count:desc"
)
```

### 2. Find Works by Author (two-step pattern)
```python
from scripts.query_helpers import find_author_works
works = find_author_works(author_name="Jennifer Doudna", client=client, limit=100)
```

### 3. Find Works from Institution
```python
from scripts.query_helpers import find_institution_works
works = find_institution_works(institution_name="Stanford University", client=client, limit=200)
```

### 4. Highly Cited Papers
```python
from scripts.query_helpers import find_highly_cited_recent_papers
papers = find_highly_cited_recent_papers(topic="quantum computing", years=">2020", client=client, limit=100)
```

### 5. Open Access Papers
```python
from scripts.query_helpers import get_open_access_papers
papers = get_open_access_papers(search_term="climate change", client=client, oa_status="gold", limit=200)
```

### 6. Publication Trends
```python
from scripts.query_helpers import get_publication_trends
trends = get_publication_trends(search_term="artificial intelligence", client=client)
```

### 7. Research Output Analysis
```python
from scripts.query_helpers import analyze_research_output
analysis = analyze_research_output(entity_type='institution', entity_name='MIT', client=client, years='>2020')
```

### 8. Batch Lookups (up to 50 IDs per request)
```python
works = client.batch_lookup(entity_type='works', ids=doi_list, id_field='doi')
```

### 9. Random Sampling (reproducible)
```python
works = client.sample_works(sample_size=100, seed=42, filter_params={"publication_year": "2023"})
```

### 10. Citation Analysis
```python
work = client.get_entity('works', 'https://doi.org/10.1038/s41586-021-03819-2')
citing_works = requests.get(work['cited_by_api_url'], params={'mailto': client.email, 'per-page': 200}).json()['results']
```

### 11. Large-Scale Extraction with Export
```python
all_papers = client.paginate_all(endpoint='/works', params={'search': 'synthetic biology'}, max_results=10000)
```

## Critical Best Practices

| Practice | Correct | Wrong |
|---|---|---|
| Email | Always add email to client | Omit email (1/10 rate limit) |
| Entity lookup | Two-step: name→ID→filter | Filter by name directly |
| Page size | `per-page=200` always | Default per-page=25 |
| Multiple IDs | `batch_lookup()` | Loop individual requests |
| Random sample | `sample_works(seed=42)` | Random page numbers |
| Fields | Use `select=` to limit | Fetch entire object |

## Filter Patterns

```python
# After year
{"publication_year": ">2020"}

# Year range
{"publication_year": "2020-2024"}

# Multiple filters (AND)
{"publication_year": ">2020", "is_oa": "true", "cited_by_count": ">100"}

# Multiple values (OR)  
{"authorships.institutions.id": "I136199984|I27837315"}  # MIT or Harvard

# Collaboration (AND within attribute)
{"authorships.institutions.id": "I136199984+I27837315"}  # MIT AND Harvard

# Negation
{"type": "!paratext"}
```

## External IDs

```python
work = client.get_entity('works', 'https://doi.org/10.7717/peerj.4375')
author = client.get_entity('authors', 'https://orcid.org/0000-0003-1613-5981')
institution = client.get_entity('institutions', 'https://ror.org/02y3ad647')
source = client.get_entity('sources', 'issn:0028-0836')
```

## Entity Types

- **works** — Scholarly documents (articles, books, datasets)
- **authors** — Researchers with disambiguated identities
- **institutions** — Universities and research organizations
- **sources** — Journals, repositories, conferences
- **topics** — Subject classifications
- **publishers** / **funders**

## Scripts

- `scripts/openalex_client.py` — Main API client (rate limiting, retry, pagination, batch)
- `scripts/query_helpers.py` — High-level helpers for common research queries

## References

- `references/api_guide.md` — Complete filter syntax, endpoints, response structures
- `references/common_queries.md` — Working examples, real-world use cases, data export
