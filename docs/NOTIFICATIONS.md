# Notifications System Documentation

This document explains how the notification system is structured across the Web App, Mobile App, and Backend, and provides a guide on how to implement new notifications using this setup.

## 1. Backend (Convex) Setup

The backend acts as the central source of truth and the orchestrator for all push notifications and in-app alerts.

### Schema (`packages/backend/convex/schema.ts`)
We added two new tables:
- **`devices`**: Stores the unique Expo push token for each mobile device that opens the app.
- **`alerts`**: Stores the actual notification data (title, body, target device, etc.) for in-app display and push notification sending.

### Core Logic (`packages/backend/convex/alerts.ts`)
- **`createAlert` (Mutation)**: This is the primary entry point for triggering a notification. It does two things:
  1. Inserts a new record into the `alerts` table (so it shows up in the mobile app's "Alerts" screen).
  2. Schedules a background task (`ctx.scheduler.runAfter`) to execute `sendPushNotification`.
- **`sendPushNotification` (Internal Action)**: This function fetches the relevant push tokens from the `devices` table and makes a POST request to Expo's Push API (`https://exp.host/--/api/v2/push/send`) to actually deliver the push notification to the user's phone.

### How to trigger a notification from the backend
Anywhere in your Convex mutations (e.g., when a user's request is approved), you can trigger a notification like this:

```typescript
import { api } from "./_generated/api";

// ... inside a mutation handler ...
await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
    title: "Your Title Here",
    body: "Your notification message here.",
    deviceId: targetDeviceId, // Optional. If omitted, it sends to ALL registered devices (Global broadcast).
    data: { customKey: "customValue" }, // Optional. Any extra data you want to pass.
});
```

---

## 2. Mobile App (Expo & React Native)

The mobile app is responsible for requesting notification permissions, registering its token with the backend, and displaying in-app alerts.

### Push Token Registration (`apps/mobile/src/hooks/usePushNotifications.ts`)
This custom hook handles the complex setup:
- It asks the user for permission to send notifications.
- It fetches the `ExpoPushToken` from Expo's servers.
- It sets up listeners for when a notification is received while the app is foregrounded or when the user taps on a notification in the system tray.

### Backend Registration (`apps/mobile/src/app/_layout.tsx`)
In the root layout, we use the `usePushNotifications` hook to get the token. Once we have it, we automatically call the `registerPushToken` Convex mutation (defined in `packages/backend/convex/devices.ts`) to save it to the database, ensuring the backend knows how to reach this specific device.

### The Alerts Screen (`apps/mobile/src/app/alerts.tsx`)
This screen queries the `alerts` table from Convex and displays a list of all historical notifications sent to the user (or global broadcasts).

### How to implement a new notification type in Mobile
1. **Define the trigger backend:** Decide what backend action should trigger the notification and add the `ctx.scheduler.runAfter` call there.
2. **Handle tap events (Optional):** If you want the app to navigate to a specific screen when the user taps the push notification, update the `responseListener` inside `usePushNotifications.ts`:

```typescript
responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data.myCustomScreen) {
        // e.g., router.push(`/matches/${data.matchId}`);
    }
});
```

---

## 3. Web Admin Dashboard (Next.js)

The web dashboard uses a simpler, immediate toast notification system strictly for providing feedback to the administrator when they perform actions.

### Setup (`apps/web/components/client-layout.tsx`)
We use the `sonner` package. The `<Toaster />` component is mounted at the root of the client-side layout.

### How to use Web toasts
In any client component (e.g., `page.tsx` with `"use client"`), import `toast` from `sonner` and call it after an action succeeds or fails:

```tsx
import { toast } from 'sonner';

const handleAction = async () => {
    try {
        await someBackendCall();
        toast.success("Action completed successfully!");
    } catch (error) {
        toast.error("Failed to perform action.");
    }
};
```
