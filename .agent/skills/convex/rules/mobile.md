# Convex Mobile Integration (React Native / Expo)

## 1. Environment & Setup
- **Polyfills**: Install `react-native-get-random-values` and include polyfills for `Buffer` and `process` to prevent crashes in the Convex client.
- **Convex Client**: Initialize the `ConvexReactClient` with the URL from your Vercel/Convex project settings.

## 2. Authentication Flow
- **Clerk Integration**: Use `ConvexProviderWithClerk` to bridge Clerk authentication with Convex. This ensures Convex functions can access the `userId`.
- **JWT Handling**: Convex automatically handles the JWT exchange when using the Clerk provider.

## 3. Offline & Connectivity
- **Reconnection Logic**: Convex handles WebSocket reconnections automatically. The UI status will reflect the last known good state.
- **Optimistic Updates**: Highly recommended for mobile to ensure the app feels fast even on spotty networks.

## 4. Expo Specifics
- **Configuration**: Set your Convex URL in `app.config.js` or as a public EXPO variable.
- **Standard Layout**: Keep your `convex/` directory at the root of the project to share logic between web and mobile easily.
