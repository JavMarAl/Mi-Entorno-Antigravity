---
name: diary
description: "Unified Diary System: A context-preserving automated logger for multi-project development."
risk: safe
source: self
---

# 📔 Unified Diary System

## When to Use This Skill
Use this skill when you want to summarize progress, write a daily dev log, or perform a daily review while keeping project contexts isolated and synced to Notion/Obsidian.

> 🚨 **Agent One-Shot Integrity Constraint (Highest Priority)**: Steps 1-4 are an **indivisible atomic workflow**. The AI **MUST use Continuous Tool Calling** to complete all actions in one breath.
> - **ABSOLUTELY FORBIDDEN** to output conversational text and wait for the user after completing Step 1, 2, or 3.

## Atomic Workflow

### Step 1: Local Project Archiving
- **Action**: Detect current project folder name and append achievements to `diary/YYYY/MM/YYYY-MM-DD-ProjectName.md`.
- **Rule**: Never pollute with global data. Use append mode.

### Step 1.5: Refresh Project Context
- **Action**: Execute `prepare_context.py` to update `AGENT_CONTEXT.md` in project root.

### Step 2: Extract Global & Project Material
- **Action**: Execute `fetch_diaries.py` with the absolute path of the local diary.

### Step 3: AI Smart Fusion & Global Archiving
- **Action**: Mentally fuse materials and write to `{diary_system_path}/diary/YYYY/MM/YYYY-MM-DD.md`.
- **Rule**: dedicated project zones, merge/deduplicate lessons learned.

### Step 4: Cloud Sync & Experience Extraction
- **Action**: Execute `master_diary_sync.py --sync-only` and extract "Improvements & Learning" for user confirmation.

## Templates

### Project Local Diary
- `# Project DevLog: {Project Name}`
- `🎯 Progress Summary`
- `🛠️ Execution Details & Changes`
- `🚨 Troubleshooting`
- `⏭️ Next Steps`

### Global Diary
- `# 📔 YYYY-MM-DD Global Progress Overview`
- `📁 Project Tracking`
- `🧠 Improvements & Learnings`
- `✅ Global Action Items`
