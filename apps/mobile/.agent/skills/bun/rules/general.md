# General Bun Usage Guidelines

## 1. Dependency Management
- **Installing**: Always use `bun add <package>` instead of `npm install` or `yarn add`.
- **Development Dependencies**: Use `bun add -d <package>` for dev dependencies.
- **Removing**: Use `bun remove <package>`.
- **Clean Install**: If `node_modules` gets corrupted, use `rm -rf node_modules bun.lockb && bun install`.

## 2. Running Scripts
- **Execute**: Use `bun run <script-name>` for any scripts defined in `package.json`.
- **Direct Execution**: You can run TypeScript/JavaScript files directly with `bun <file.ts>`.
- **Binary Execution**: Use `bunx <package>` to run a package's binary (like `npx`).

## 3. Workspaces (Monorepos)
- **Installing in Workspace**: Use `bun add <package> --filter <workspace-name>` if applicable, or run `bun add` within the workspace directory.
- **Running in Workspace**: Use `bun run --filter <workspace-name> <script>`.

## 4. Environment Variables
- **Automatic Loading**: Bun automatically loads `.env` files. No need for `dotenv` package in most cases.
- **Prefixes**: For specific frameworks (like Next.js or Expo), ensure the correct variable prefixes are used (e.g., `NEXT_PUBLIC_` or `EXPO_PUBLIC_`).
