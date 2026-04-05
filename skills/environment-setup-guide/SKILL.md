---
name: environment-setup-guide
description: "Guide developers through setting up development environments with proper tools, dependencies, and configurations"
risk: safe
source: community
date_added: "2026-03-11"
---

# Environment Setup Guide

Help developers set up complete development environments from scratch. This skill provides step-by-step guidance for installing tools, configuring dependencies, setting up environment variables, and verifying the setup.

## When to Use This Skill

- Starting a new project/onboarding.
- Switching machines or OS.
- Troubleshooting environment issues.
- Documenting setup for others.

## How It Works

### Step 1: Identify Requirements
Define languages (Node, Python, etc.), package managers, databases, and tools (Git, Docker).

### Step 2: Check Current Setup
Run version checks: `node --version`, `python --version`, `git --version`, etc.

### Step 3: Installation Instructions
- **macOS**: Homebrew (`brew install`)
- **Linux**: Package managers (`apt`, `yum`)
- **Windows**: `choco`, `scoop`, or direct installers.

### Step 4: Configure the Environment
- Set up `.env` files.
- Configure Shell (`.bashrc`, `.zshrc`) and IDE settings.

### Step 5: Verify Installation
Run test commands, verify database connections, and check environment variables.

## Best Practices
- **Use Version Managers**: `nvm` for Node, `pyenv` for Python.
- **Isolate**: Use Docker or Virtual Environments where possible.
- **Automate**: Create `setup.sh` or `setup.ps1` scripts.
- **Document**: Keep instructions up-to-date in README or dedicated docs.

## Resources
- **scripts/setup-template.sh**: Bash template for automated setup.
- **scripts/env-check.ps1**: PowerShell script for environment verification on Windows.
