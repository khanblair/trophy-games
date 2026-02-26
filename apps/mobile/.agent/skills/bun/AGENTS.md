# Bun AGENTS Guide

Guidelines for AI agents when performing package management tasks.

## Mandatory Commands
| Action | Command |
| --- | --- |
| Install All | `bun install` |
| Add Package | `bun add <name>` |
| Add Dev | `bun add -d <name>` |
| Remove | `bun remove <name>` |
| Run Script | `bun run <script>` |
| Run Binary | `bunx <command>` |

## Workflow for Agents
1. **Never use npm/yarn**: If you see a `package-lock.json` or `yarn.lock`, do not update them. Stick to `bun.lockb`.
2. **Fast Verification**: After adding a package, immediately run `bun run build` or `bun tsc` to verify compatibility.
3. **Script Execution**: If asked to "start the app", look for the script in `package.json` and use `bun run <script>`.

## Troubleshooting
- **Lockfile Conflicts**: If `bun.lockb` has merge conflicts, it is often safer to delete it and run `bun install` to regenerate it.
- **Missing Peer Deps**: Bun is strict about peer dependencies. Read the output carefully and add missing ones if prompted.
