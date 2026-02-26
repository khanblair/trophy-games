---
name: bun
description: Package management and runtime guidelines using Bun. Always prefer Bun over npm, yarn, or pnpm.
metadata:
  author: Antigravity
  version: "1.0.0"
---

# Bun: Fast Package Management & Runtime

Bun is an all-in-one JavaScript runtime and package manager designed for speed. In this project, **always use Bun** for installing dependencies, running scripts, and managing workspaces.

## When to Apply

Reference these guidelines when:
- Installing or removing dependencies
- Running development scripts (`bun run`)
- Managing monorepo workspaces
- Executing fast shell commands or scripts

## Core Principles

- **Speed First**: Bun's package manager is significantly faster than alternatives.
- **Native TypeScript Support**: Execute `.ts` files directly without separate compilation steps.
- **Single Tooling**: Use `bun` for everything—installing, testing, and running.

## Guides

- [General Bun Usage](rules/general.md)

## Full Guide
For the complete guide with all rules expanded: `AGENTS.md`
