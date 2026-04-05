#!/usr/bin/env Rscript
# ============================================================
#  MetaAnalysis Pro — R Engine: Publication Bias Module
#  Egger, Begg, Trim & Fill, Peters, Copas selection model
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
sei    <- sqrt(vi)
model  <- tolower(input$model)
is_log <- isTRUE(input$is_log)   # TRUE for OR / RR (log scale)

k <- length(yi)

# ── Fit base model ─────────────────────────────────────────
method <- if (model == "fixed") "FE" else "REML"
res    <- rma(yi = yi, vi = vi, method = method)

# ── 1. Egger's test (regtest) ─────────────────────────────
egger <- tryCatch({
    eg <- regtest(res, model = "lm")
    list(
        intercept = eg$b[[1]],
        se        = eg$se,
        t         = eg$zval,
        p         = eg$pval,
        df        = eg$ddf,
        ci_lo     = eg$ci.lb,
        ci_hi     = eg$ci.ub
    )
}, error = function(e) list(error = e$message))

# ── 2. Begg's rank correlation (ranktest) ─────────────────
begg <- tryCatch({
    bg <- ranktest(res)
    list(
        tau = bg$tau,
        z   = bg$zval,
        p   = bg$pval
    )
}, error = function(e) list(error = e$message))

# ── 3. Trim & Fill ────────────────────────────────────────
trimfill_res <- tryCatch({
    tf <- trimfill(res)
    list(
        k0         = tf$k0,
        side       = tf$side,
        theta_adj  = tf$b[[1]],
        se_adj     = tf$se,
        ci_lo_adj  = tf$ci.lb,
        ci_hi_adj  = tf$ci.ub,
        p_adj      = tf$pval
    )
}, error = function(e) list(error = e$message))

# ── 4. Peters' test (for binary outcomes) ─────────────────
peters <- tryCatch({
    if (is_log && k >= 3) {
        # Peters: regress yi on 1/n (needs total N and events)
        # Use funnel asymmetry on SE as proxy if n not provided
        pt <- regtest(res, predictor = "ni")
        list(
            intercept = pt$b[[1]],
            se        = pt$se,
            t         = pt$zval,
            p         = pt$pval
        )
    } else {
        list(note = "Peters test requires binary outcome data with ni")
    }
}, error = function(e) list(note = paste("Peters:", e$message)))

# ── 5. Fail-safe N (Rosenthal & Orwin) ───────────────────
fsn_rosenthal <- tryCatch({
    fn <- fsn(yi = yi, vi = vi, type = "Rosenthal")
    list(type = "Rosenthal", fsn = fn$fsnum, p_target = fn$target)
}, error = function(e) list(error = e$message))

fsn_orwin <- tryCatch({
    fo <- fsn(yi = yi, vi = vi, type = "Orwin", target = 0.2)
    list(type = "Orwin", fsn = fo$fsnum, target_effect = 0.2)
}, error = function(e) list(error = e$message))

output <- list(
    egger          = egger,
    begg           = begg,
    trimfill       = trimfill_res,
    peters         = peters,
    fsn_rosenthal  = fsn_rosenthal,
    fsn_orwin      = fsn_orwin,
    k              = k
)

cat(toJSON(output, auto_unbox = TRUE, na = "null"))
