#!/usr/bin/env Rscript
# ============================================================
#  MetaAnalysis Pro — R Engine: R Code Exporter
#  Generates a publication-ready, reproducible R script
#  from the user's data and analysis choices.
# ============================================================

suppressMessages(library(jsonlite))

args <- commandArgs(trailingOnly = TRUE)
if (length(args) == 0) stop("No input file provided")
input_file <- args[1]
raw <- paste(readLines(input_file, warn = FALSE), collapse = "\n")

input       <- fromJSON(raw)
yi          <- as.numeric(input$yi)
vi          <- as.numeric(input$vi)
labels      <- as.character(input$labels)
model       <- tolower(input$model)
analysisTpe <- input$analysisType
effectMeas  <- input$effectMeasure
title       <- if (!is.null(input$title)) input$title else "Mi Meta-análisis"

method_r <- if (model == "fixed") '"FE"' else '"REML"'

# Format vectors for R code
yi_str     <- paste0("c(", paste(round(yi, 6), collapse = ", "), ")")
vi_str     <- paste0("c(", paste(round(vi, 6), collapse = ", "), ")")
labels_str <- paste0('c("', paste(labels, collapse = '", "'), '")')

script <- paste0(
'# ============================================================
# Análisis de Meta-análisis — ', title, '
# Generado por MetaAnalysis Pro (', format(Sys.time(), "%Y-%m-%d %H:%M"), ')
# Método de estimación de tau2: ', if (model == "fixed") "Fixed Effects (IV)" else "REML", '
# Tipo de análisis: ', analysisTpe, ' | Medida de efecto: ', effectMeas, '
# ============================================================

# Instalar y cargar paquetes necesarios
if (!require("metafor")) install.packages("metafor", repos = "https://cran.rstudio.com/")
if (!require("meta"))    install.packages("meta",    repos = "https://cran.rstudio.com/")
library(metafor)
library(meta)

# ── Datos ─────────────────────────────────────────────────
yi     <- ', yi_str, '   # Tamaños de efecto
vi     <- ', vi_str, '   # Varianzas
sei    <- sqrt(vi)        # Errores estándar
labels <- ', labels_str, '

# ── Modelo principal ──────────────────────────────────────
res <- rma(yi = yi, vi = vi, method = ', method_r, ', slab = labels)
print(summary(res))

# ── Forest plot ───────────────────────────────────────────
forest(res,
       header   = c("Estudio", "', effectMeas, ' [95% CI]"),
       xlab     = "', effectMeas, '",
       mlab     = paste0(if (', tolower(as.character(model == "random")), ') "RE Model (REML)" else "FE Model",
                         " [I2 = ", round(res$I2, 1), "%, p = ", round(res$QEp, 3), "]"),
       col      = "steelblue",
       border   = "steelblue")

# ── Heterogeneidad ────────────────────────────────────────
cat("\\n=== Heterogeneidad ===\\n")
cat("Q =", round(res$QE, 3), " df =", res$QEdf, " p =", round(res$QEp, 4), "\\n")
cat("I2 =", round(res$I2, 2), "%\\n")
cat("tau2 =", round(res$tau2, 4), " tau =", round(sqrt(res$tau2), 4), "\\n")

# IC para I2 y tau2 (Q-profile)
ci_res <- confint(res)
print(ci_res)

# ── Sesgo de publicación ──────────────────────────────────
cat("\\n=== Sesgo de Publicación ===\\n")

# Funnel plot
funnel(res, main = "Funnel Plot", xlab = "', effectMeas, '")

# Test de Egger
egger <- regtest(res, model = "lm")
cat("Egger: intercept =", round(egger$b[[1]], 4),
    " t =", round(egger$zval, 3), " p =", round(egger$pval, 4), "\\n")

# Test de Begg
begg <- ranktest(res)
cat("Begg: tau =", round(begg$tau, 4), " p =", round(begg$pval, 4), "\\n")

# Trim & Fill
tf <- trimfill(res)
cat("Trim & Fill: k0 =", tf$k0, " theta_adj =", round(tf$b[[1]], 4), "\\n")
forest(tf, xlab = "', effectMeas, '", main = "Trim & Fill")

# ── Sensibilidad (Leave-one-out) ──────────────────────────
cat("\\n=== Leave-One-Out ===\\n")
loo <- leave1out(res)
print(loo)

# ── Diagnósticos de influencia ────────────────────────────────
cat("\\n=== Influencia ===\\n")
inf <- influence(res)
print(inf)
plot(inf)

# ── Meta-regresión (si tienes moderadores) ────────────────
# Descomenta y ajusta según tus variables:
# moderador <- c(...)   # tu variable moderadora
# res_reg <- rma(yi = yi, vi = vi, mods = ~ moderador, method = ', method_r, ')
# print(summary(res_reg))
# regplot(res_reg, xlab = "Moderador", ylab = "', effectMeas, '")

cat("\\n✅ Análisis completado\\n")
')

output <- list(code = script)
cat(toJSON(output, auto_unbox = TRUE))
