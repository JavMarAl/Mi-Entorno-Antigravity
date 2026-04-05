#!/usr/bin/env Rscript
# ============================================================
#  MetaAnalysis Pro — R Engine: Meta-Regression Module
#  Multiple moderators, REML tau2, R2 Raudenbush, permutation
# ============================================================

suppressMessages({
    library(metafor)
    library(jsonlite)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) == 0) stop("No input file provided")
input_file <- args[1]
raw <- paste(readLines(input_file, warn = FALSE), collapse = "\n")

input      <- fromJSON(raw)
yi         <- as.numeric(input$yi)
vi         <- as.numeric(input$vi)
model      <- tolower(input$model)
mods_data  <- input$moderators  # list of {name, type, values}

k <- length(yi)

# Build moderator matrix
build_mods <- function(mods) {
    if (length(mods) == 0 || is.null(mods)) return(NULL)
    df <- data.frame(row.names = seq_len(k))
    for (m in mods) {
        if (m$type == "continuous") {
            df[[m$name]] <- as.numeric(m$values)
        } else {
            df[[m$name]] <- factor(as.character(m$values))
        }
    }
    df
}

mods_df <- build_mods(mods_data)

# Fit null model (intercept only) for R2 calculation
method <- if (model == "fixed") "FE" else "REML"
res0   <- tryCatch(rma(yi = yi, vi = vi, method = method), error = function(e) NULL)

# Fit regression model
res <- tryCatch({
    if (is.null(mods_df)) {
        rma(yi = yi, vi = vi, method = method)
    } else {
        rma(yi = yi, vi = vi, mods = as.matrix(mods_df), method = method)
    }
}, error = function(e) {
    list(error = e$message)
})

if (!is.null(res$error)) {
    cat(toJSON(list(error = res$error), auto_unbox = TRUE))
    quit(status = 0)
}

# Extract coefficients
coef_names <- rownames(res$b)
coefs <- lapply(seq_along(coef_names), function(i) {
    list(
        name  = coef_names[i],
        b     = res$b[i],
        se    = res$se[i],
        z     = res$zval[i],
        p     = res$pval[i],
        ci_lo = res$ci.lb[i],
        ci_hi = res$ci.ub[i]
    )
})

# R2 Raudenbush (proportion of tau2 explained by moderators)
R2 <- NA
if (!is.null(res0) && model == "random") {
    tau2_null <- res0$tau2
    tau2_full <- res$tau2
    if (!is.null(tau2_null) && !is.null(tau2_full) && tau2_null > 0) {
        R2 <- max(0, (tau2_null - tau2_full) / tau2_null) * 100
    }
}

output <- list(
    coefficients = coefs,
    Q_model      = res$QM,
    df_model     = res$QMdf[1],
    p_model      = res$QMp,
    Q_residual   = res$QE,
    df_residual  = res$QEdf,
    p_residual   = res$QEp,
    tau2         = ifelse(is.null(res$tau2), 0, res$tau2),
    I2           = ifelse(is.null(res$I2), 0, res$I2),
    R2_raudenbush = R2,
    k            = res$k,
    method       = method,
    fitted       = as.numeric(fitted(res))
)

cat(toJSON(output, auto_unbox = TRUE, na = "null"))
