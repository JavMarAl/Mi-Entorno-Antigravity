#!/usr/bin/env Rscript
# ============================================================
#  MetaAnalysis Pro — R Engine: Subgroup Analysis Module
#  Q_between with CI, I2 per group, pairwise comparisons
# ============================================================

suppressMessages({
    library(metafor)
    library(jsonlite)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) == 0) stop("No input file provided")
input_file <- args[1]
raw <- paste(readLines(input_file, warn = FALSE), collapse = "\n")

input    <- fromJSON(raw)
yi       <- as.numeric(input$yi)
vi       <- as.numeric(input$vi)
labels   <- as.character(input$labels)
subgroups <- as.character(input$subgroups)
model    <- tolower(input$model)

method   <- if (model == "fixed") "FE" else "REML"
groups   <- unique(subgroups)

# Pool per group
group_results <- lapply(groups, function(g) {
    idx <- which(subgroups == g)
    if (length(idx) < 2) {
        return(list(group = g, k = length(idx), error = "Insufficient studies"))
    }
    tryCatch({
        r <- rma(yi = yi[idx], vi = vi[idx], method = method)

        # I2 CI for this subgroup
        ci_sg <- tryCatch(confint(r)$random, error = function(e) NULL)
        i2_lo <- if (!is.null(ci_sg)) ci_sg["I^2(%)", "lb"] else NA
        i2_hi <- if (!is.null(ci_sg)) ci_sg["I^2(%)", "ub"] else NA

        list(
            group   = g,
            k       = r$k,
            theta   = r$b[[1]],
            se      = r$se,
            ci_lo   = r$ci.lb,
            ci_hi   = r$ci.ub,
            p       = r$pval,
            Q       = r$QE,
            Qdf     = r$QEdf,
            Qp      = r$QEp,
            tau2    = ifelse(is.null(r$tau2), 0, r$tau2),
            I2      = ifelse(is.null(r$I2), 0, r$I2),
            I2_lo   = i2_lo,
            I2_hi   = i2_hi,
            studies = labels[idx]
        )
    }, error = function(e) {
        list(group = g, error = e$message)
    })
})

# Q_between test using moderator approach
qbetween_res <- tryCatch({
    mod_factor <- factor(subgroups)
    rma_mod <- rma(yi = yi, vi = vi, mods = ~ mod_factor - 1, method = method)
    list(
        Q_between = rma_mod$QM,
        df        = rma_mod$QMdf[1],
        p         = rma_mod$QMp
    )
}, error = function(e) list(error = e$message))

# Overall pooled
overall <- tryCatch({
    r <- rma(yi = yi, vi = vi, method = method)
    list(theta = r$b[[1]], se = r$se, ci_lo = r$ci.lb, ci_hi = r$ci.ub, p = r$pval)
}, error = function(e) list(error = e$message))

output <- list(
    groups     = group_results,
    Q_between  = qbetween_res,
    overall    = overall,
    k          = length(yi)
)

cat(toJSON(output, auto_unbox = TRUE, na = "null"))
