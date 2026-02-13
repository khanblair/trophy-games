---
name: convex
description: Real-time backend and database development guidelines using Convex for web and mobile applications.
metadata:
  author: Antigravity
  version: "1.0.0"
---

# Convex: The Reactive Backend

Convex is a transactional, real-time backend that simplifies data management with TypeScript-first development.

## When to Apply

Reference these guidelines when:
- Writing database queries, mutations, or actions
- Designing a database schema with `schema.ts`
- Implementing real-time UI updates with `useQuery`
- Handling background processing or scheduled jobs
- Integrating third-party services via Convex Actions

## Core Principles

- **Reactivity by Default**: UI updates automatically when data changes.
- **End-to-End Type Safety**: Use `query`, `mutation`, and `action` wrappers for full TypeScript integration.
- **Transactional Integrity**: Mutations are ACID compliant and execute atomically.

## Guides

- [Web Performance](rules/web.md)
- [Mobile Integration](rules/mobile.md)

## Full Guide
For the complete guide with all rules expanded: `AGENTS.md`
