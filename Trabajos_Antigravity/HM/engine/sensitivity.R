#!/usr/bin/env Rscript
# ============================================================
#  MetaAnalysis Pro — R Engine: Sensitivity & Influence
#  Leave-one-out + DFFITS + Cook's D + CovRatio + outliers
# ============================================================

suppressMessages({
    library(metafor)
    library(jsonlite)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) == 0) stop("No input file provided")
input_file <- args[1]
raw <- paste(readLines(input_file, warn = FALSE), collapse = "\n")

input  <- fromJSON(raw)
yi     <- as.numeric(input$yi)
vi     <- as.numeric(input$vi)
labels <- as.character(input$labels)
model  <- tolower(input$model)

method <- if (model == "fixed") "FE" else "REML"
res    <- rma(yi = yi, vi = vi, method = method, slab = labels)

# ── Leave-one-out ─────────────────────────────────────────
loo <- tryCatch({
    l <- leave1out(res)
    lapply(seq_along(labels), function(i) {
        list(
            omitted  = labels[i],
            theta    = l$estimate[i],
            se       = l$se[i],
            ci_lo    = l$ci.lb[i],
            ci_hi    = l$ci.ub[i],
            Q        = l$Q[i],
            Qp       = l$Qp[i],
            tau2     = ifelse(model == "fixed", 0, l$tau2[i]),
            I2       = ifelse(model == "fixed", 0, l$I2[i])
        )
    })
}, error = function(e) list(error = e$message))

# ── Influence diagnostics ─────────────────────────────────
infl <- tryCatch({
    inf <- influence(res)
    inf_stats <- inf$inf

    list(
        dffits    = as.numeric(inf_stats$dffits),
        cook_d    = as.numeric(inf_stats$cook.d),
        cov_ratio = as.numeric(inf_stats$cov.r),
        hat       = as.numeric(inf_stats$hat),
        std_res   = as.numeric(rstudent(res)$z),
        tau2_del  = if (!is.null(inf_stats$tau2.del)) as.numeric(inf_stats$tau2.del) else rep(NA, length(yi)),
        weight_pct = as.numeric(weights(res))
    )
}, error = function(e) list(error = e$message))

# ── Outlier detection ─────────────────────────────────────
outliers <- tryCatch({
    std_res <- rstudent(res)$z
    which(abs(std_res) > 3)  # study indices (1-based) with |z| > 3
}, error = function(e) integer(0))

output <- list(
    loo      = loo,
    infl     = infl,
    outliers = outliers,
    labels   = labels,
    k        = length(yi)
)

cat(toJSON(output, auto_unbox = TRUE, na = "null"))
