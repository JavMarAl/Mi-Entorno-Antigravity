---
name: polars
description: Fast in-memory DataFrame library for datasets that fit in RAM. Use when pandas is too slow but data still fits in memory. Lazy evaluation, parallel execution, Apache Arrow backend. Best for 1-100GB datasets, ETL pipelines, faster pandas replacement. For larger-than-RAM data use dask or vaex.
license: https://github.com/pola-rs/polars/blob/main/LICENSE
metadata:
    skill-author: K-Dense Inc.
---

# Polars

Lightning-fast DataFrame library built on Apache Arrow with lazy evaluation, parallel execution, and an expression-based API.

## Quick Start

```bash
uv pip install polars
```

```python
import polars as pl

df = pl.DataFrame({"name": ["Alice", "Bob"], "age": [25, 30]})
df.filter(pl.col("age") > 25)
df.with_columns(age_months=pl.col("age") * 12)
```

## Core Concepts

### Lazy vs Eager

| Mode | API | When to Use |
|------|-----|-------------|
| **Eager** | `pl.read_csv()`, `pl.DataFrame` | Small data, immediate results |
| **Lazy** | `pl.scan_csv()`, `pl.LazyFrame` | Large data, complex pipelines, performance |

```python
# Lazy (preferred for large data)
lf = pl.scan_csv("large.csv")
result = lf.filter(pl.col("age") > 25).select("name", "age").collect()
```

Lazy evaluation enables: query optimization, predicate pushdown, projection pushdown, parallel execution.

## Common Operations

### Select / Filter / With Columns

```python
df.select("name", "age")
df.select(pl.col("name"), (pl.col("age") * 2).alias("double_age"))

df.filter(pl.col("age") > 25)
df.filter(pl.col("age") > 25, pl.col("city") == "NY")  # AND
df.filter((pl.col("age") > 25) | (pl.col("city") == "LA"))  # OR

df.with_columns(age_upper=pl.col("age") + 10, name_up=pl.col("name").str.to_uppercase())
```

### Group By / Aggregations

```python
df.group_by("city").agg(pl.col("age").mean().alias("avg_age"), pl.len().alias("count"))
df.group_by("city", "dept").agg(pl.col("salary").sum())
```

### Window Functions

```python
df.with_columns(avg_age_by_city=pl.col("age").mean().over("city"))
df.with_columns(rank=pl.col("salary").rank().over("city"))
```

### Joins / Concatenation

```python
df1.join(df2, on="id", how="inner")        # inner join
df1.join(df2, left_on="user_id", right_on="id", how="left")  # different column names
pl.concat([df1, df2], how="vertical")       # stack rows
pl.concat([df1, df2], how="horizontal")     # add columns
pl.concat([df1, df2], how="diagonal")       # union with different schemas
```

### Pivot / Unpivot

```python
df.pivot(values="sales", index="date", columns="product")
df.unpivot(index="id", on=["col1", "col2"])
```

## Data I/O

```python
pl.read_csv("file.csv")       / df.write_csv("out.csv")
pl.read_parquet("file.parquet") / df.write_parquet("out.parquet")  # ✅ Recommended
pl.read_json("file.json")     / df.write_json("out.json")
pl.scan_csv("big.csv")        # lazy — doesn't read until .collect()
```

## Key Differences from Pandas

| Concept | Pandas | Polars |
|---------|--------|--------|
| Column select | `df["col"]` | `df.select("col")` |
| Filter | `df[df["col"] > 10]` | `df.filter(pl.col("col") > 10)` |
| Add column | `df.assign(x=...)` | `df.with_columns(x=...)` |
| Group by | `df.groupby("col").agg(...)` | `df.group_by("col").agg(...)` |
| Window | `.groupby().transform(...)` | `.with_columns(...).over("col")` |
| Sequential | `df.assign(a=lambda d: ..., b=lambda d: ...)` | `df.with_columns(a=..., b=...)` ← parallel |

Polars has **no index**, **strict typing**, and **no silent type conversions**.

## Performance Tips

1. **Use lazy for large datasets:** `pl.scan_csv()` over `pl.read_csv()`
2. **Select needed columns early** to minimize data loaded
3. **Avoid `.map_elements()`** — stays outside the parallel expression engine
4. **Streaming for very large data:** `lf.collect(streaming=True)`
5. **Use categorical** for low-cardinality string columns

## Useful Expression Patterns

```python
pl.when(condition).then(value).otherwise(other)   # conditional
pl.col("^.*_value$") * 2                          # regex column selection
pl.col("x").fill_null(0) / .is_null() / .drop_nulls()  # null handling
```

## References

- `references/core_concepts.md` — Expressions, lazy evaluation, type system
- `references/operations.md` — All common operations with examples
- `references/pandas_migration.md` — Full pandas → Polars migration guide
- `references/io_guide.md` — I/O for all supported formats
- `references/transformations.md` — Joins, pivots, reshape operations
- `references/best_practices.md` — Performance optimization and patterns
