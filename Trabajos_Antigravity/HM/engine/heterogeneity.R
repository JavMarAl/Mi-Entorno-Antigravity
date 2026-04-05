#!/usr/bin/env Rscript
# ============================================================
#  MetaAnalysis Pro — R Engine: Heterogeneity Module
#  Complete heterogeneity stats with CIs for I2 and tau2.
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

yi    <- as.numeric(input$yi)
vi    <- as.numeric(input$vi)
model <- tolower(input$model)

# Fit model
method <- if (model == "fixed") "FE" else "REML"
res    <- rma(yi = yi, vi = vi, method = method)

# Full CI via Q-profile (gold standard)
ci <- tryCatch(confint(res), error = function(e) NULL)

i2       <- res$I2
tau2     <- ifelse(is.null(res$tau2), 0, res$tau2)
tau      <- sqrt(max(0, tau2))
H2       <- ifelse(is.null(res$H2), 1, res$H2)
Q        <- res$QE
Qdf      <- res$QEdf
Qp       <- res$QEp

# I2 CI from Q-profile confint
i2_lo  <- NA; i2_hi  <- NA
tau2_lo <- NA; tau2_hi <- NA
if (!is.null(ci) && !is.null(ci$random)) {
    i2_lo   <- ci$random["I^2(%)", "lb"]
    i2_hi   <- ci$random["I^2(%)", "ub"]
    tau2_lo <- ci$random["tau^2",  "lb"]
    tau2_hi <- ci$random["tau^2",  "ub"]
}

# Higgins' H and R2
R2 <- NA  # only meaningful if there's a moderator

# Standardized residuals for heterogeneity visualization
stud_res <- tryCatch(rstudent(res)$z, error = function(e) rep(NA, length(yi)))

output <- list(
    Q        = Q,
    Qdf      = Qdf,
    Qp       = Qp,
    I2       = i2,
    I2_lo    = i2_lo,
    I2_hi    = i2_hi,
    tau2     = tau2,
    tau2_lo  = tau2_lo,
    tau2_hi  = tau2_hi,
    tau      = tau,
    H2       = H2,
    stud_res = stud_res,
    k        = res$k,
    model    = method
)

cat(toJSON(output, auto_unbox = TRUE, na = "null"))
