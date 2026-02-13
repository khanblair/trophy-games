# Convex Web Performance (Next.js)

## 1. Efficient Queries
- **Indexing**: Use `.withIndex()` to avoid expensive full-table scans. Conditions in `withIndex` are performant and filter data server-side.
- **Avoid `.collect()`**: For large datasets, use pagination or pre-filtering instead of collecting all documents at once.

## 2. Mutations & Optimistic Updates
- **Snappy UI**: Use the `optimisticUpdate` option in `useMutation` to reflect changes immediately in the UI before the server confirms.
- **Transactional Logic**: Keep mutations focused and ACID compliant. Avoid performing side effects inside mutations; use Actions instead.

## 3. Real-time Subscription
- **`useQuery` Hook**: Check for `undefined` to handle loading states. Convex automatically manages the WebSocket connection for you.
- **Data Denormalization**: In some cases, denormalize data to avoid complex joins that could trigger excessive re-renders.

## 4. Public API Security
- **Argument Validation**: Use `v` (Convex validator) to strictly type all function arguments.
- **Authentication**: Check `ctx.auth.getUserIdentity()` in your functions to restrict data access.
