#!/usr/bin/env Rscript
# ============================================================
#  MetaAnalysis Pro — R Engine: Pooling Module
#  Runs fixed and random effects pooling with multiple tau2
#  estimators. Returns JSON to Node.js via stdout.
# ============================================================

suppressMessages({
    library(metafor)
    library(jsonlite)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) == 0) stop("No input file provided")
input_file <- args[1]
raw <- paste(readLines(input_file, warn = FALSE), collapse = "\n")

input <- fromJSON(raw)

yi      <- as.numeric(input$yi)
vi      <- as.numeric(input$vi)
labels  <- as.character(input$labels)
model   <- tolower(input$model)   # "fixed" or "random"
measure <- input$effectMeasure    # From StatsEngine ("SMD" or "MD")

run_model <- function(method) {
    tryCatch({
        if (model == "fixed") {
            res <- rma(yi = yi, vi = vi, method = "FE", slab = labels)
        } else {
            res <- rma(yi = yi, vi = vi, method = method, slab = labels)
        }

        # Prediction interval (random only)
        pi_lo <- NA; pi_hi <- NA
        if (model == "random") {
            pi <- predict(res)
            pi_lo <- pi$pi.lb
            pi_hi <- pi$pi.ub
        }

        # I2 confidence interval (Higgins & Thompson 2002)
        i2_ci <- tryCatch({
            confint(res)$random["I^2(%)",]
        }, error = function(e) c(lb = NA, ub = NA))

        # tau2 CI (Q-profile)
        tau2_ci <- tryCatch({
            confint(res)$random["tau^2",]
        }, error = function(e) c(lb = NA, ub = NA))

        list(
            method     = method,
            theta      = as.numeric(res$b),
            se         = as.numeric(res$se),
            z          = as.numeric(res$zval),
            p          = as.numeric(res$pval),
            ci_lo      = as.numeric(res$ci.lb),
            ci_hi      = as.numeric(res$ci.ub),
            pi_lo      = as.numeric(pi_lo),
            pi_hi      = as.numeric(pi_hi),
            Q          = as.numeric(res$QE),
            Qdf        = as.numeric(res$QEdf),
            Qp         = as.numeric(res$QEp),
            tau2       = ifelse(is.null(res$tau2), 0, res$tau2),
            tau2_ci_lo = unname(tau2_ci["lb"]),
            tau2_ci_hi = unname(tau2_ci["ub"]),
            tau        = ifelse(is.null(res$tau2), 0, sqrt(res$tau2)),
            I2         = ifelse(is.null(res$I2), 0, res$I2),
            I2_ci_lo   = unname(i2_ci["lb"]),
            I2_ci_hi   = unname(i2_ci["ub"]),
            H2         = ifelse(is.null(res$H2), 1, res$H2),
            k          = res$k,
            weights    = weights(res)
        )
    }, error = function(e) {
        list(method = method, error = e$message)
    })
}

# Run primary model
if (model == "fixed") {
    primary <- run_model("FE")
    methods_results <- list(FE = primary)
} else {
    # Run all tau2 estimators for comparison
    tau2_methods <- c("DL", "REML", "PM", "EB", "ML", "SJ", "HE")
    methods_results <- lapply(tau2_methods, run_model)
    names(methods_results) <- tau2_methods
    primary <- methods_results[["REML"]]  # REML is the recommended default
}

output <- list(
    primary         = primary,
    all_methods     = methods_results,
    model_type      = model,
    k               = length(yi),
    yi              = yi,
    vi              = vi,
    labels          = labels
)

cat(toJSON(output, auto_unbox = TRUE, na = "null"))
