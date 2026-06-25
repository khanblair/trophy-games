# Google Play Console — Subscription Setup Guide

This guide walks you through setting up subscriptions for Trophy Games so the in-app purchase buttons work.

---

## Prerequisites

- [x] Google Play Console account (you already have this)
- [x] App created in Play Console (`com.khanblair.trophygames`)
- [x] App uploaded at least once (APK or AAB)
- [x] Payments profile set up (Play Console → Settings → Payments)

---

## Step 1: Create Subscription Products

Go to **Play Console → Monetize → Products → Subscriptions**.

Create these 3 products. The **Product ID must match EXACTLY** what's coded in `packages/shared/subscriptions.ts`:

### 1. VIP Weekly (7-day auto-renewing)

| Field | Value |
|---|---|
| **Product ID** | `com.khanblair.trophygames.vip.weekly` |
| **Name** | VIP Weekly |
| **Description** | Full VIP access — elite AI predictions, 7 days auto-renewing |
| **Billing period** | Weekly (auto-renewing) |
| **Price** | Set your price (e.g., KSh 200/week) |
| **Free trial** | Optional (recommended: 3 days) |
| **Grace period** | 3 days |

### 2. VIP Monthly (30-day auto-renewing)

| Field | Value |
|---|---|
| **Product ID** | `com.khanblair.trophygames.vip.monthly` |
| **Name** | VIP Monthly |
| **Description** | Full VIP access — elite AI predictions, 30 days auto-renewing |
| **Billing period** | Monthly (auto-renewing) |
| **Price** | Set your price (e.g., KSh 500/month) |
| **Free trial** | Optional |
| **Grace period** | 3 days |

### 3. Paid Monthly (30-day auto-renewing)

| Field | Value |
|---|---|
| **Product ID** | `com.khanblair.trophygames.paid.monthly` |
| **Name** | Paid Tips Monthly |
| **Description** | Premium access to paid match predictions, 30 days auto-renewing |
| **Billing period** | Monthly (auto-renewing) |
| **Price** | Set your price (e.g., KSh 300/month) |
| **Free trial** | Optional |
| **Grace period** | 3 days |

> ⚠️ **Critical**: The Product ID must match the strings in `packages/shared/subscriptions.ts` exactly. If they don't match, `react-native-iap` won't find the products.

---

## Step 2: Configure Subscription Settings

In the same **Subscriptions** page:

### Base Plan
- Create a "base plan" for each subscription
- Set the **auto-renewing** option
- Set pricing that includes all applicable taxes (VAT)

### Offers (optional)
- **Introductory price**: Discount for first period
- **Free trial**: 3-7 days free (increases conversion)

### Manage Subscription
- Enable **Account hold** for payment failures
- Set **Grace period** (3 days recommended)
- Enable **Restore purchases** option

---

## Step 3: Upload a Test Build

You need at least one APK/AAB uploaded to test IAP:

```bash
cd apps/mobile

# Build the production APK/AAB
eas build --profile production --platform android

# OR for testing, build a development APK
eas build --profile development --platform android
```

Upload the resulting file to Play Console → Testing → Internal testing (or Closed testing).

---

## Step 4: Add License Testers

For testing purchases without real money:

1. Go to **Play Console → Setup → License testing**
2. Add your test Google accounts (the Gmail addresses you'll use on your test device)
3. These testers can make purchases **without being charged**

> ⚠️ License testers must also be added to the **Testing track** (Internal/Closed testing) and have their device registered.

---

## Step 5: Add BILLING Permission to App

This is **already done** in your `app.json`:

```json
"android": {
    "permissions": ["com.android.vending.BILLING"]
}
```

This allows the app to use Google Play Billing on the device.

---

## Step 6: Build & Install the Dev Client

Since `react-native-iap` requires native code, you need a dev build:

```bash
cd apps/mobile

# Install the new dependency
bun install

# Build a development client
eas build --profile development --platform android

# Wait for build (~10-15 min), then scan the QR code on your
# Android device or download the APK from the EAS dashboard.

# After installing, start the dev server:
bun run dev
```

The app will connect to your local dev server and hot-reload as usual.

---

## Step 7: Test a Purchase

1. **Ensure both the app and Google Play Store are signed in with the same test account**
2. Open the app → go to **MEMBERSHIP** tab
3. If you see prices (from Google Play), the IAP connection works ✓
4. Tap **SUBSCRIBE** on VIP Weekly
5. The Google Play payment sheet should appear
6. Complete the purchase (it's free for license testers)
7. You should see "Purchase Successful!" alert
8. The VIP access should activate immediately — no admin approval needed

---

## Step 8: Verify in Convex Dashboard

Go to your Convex dashboard and check:

- **`purchases` table** — should have a new row with `status: "verified"`
- **`accessTokens` table** — should have a new token with `isActive: true` and `isClaimed: true`

---

## Step 9: Go Live

When you're ready for real users:

1. **In Play Console** → set subscription prices to your real prices
2. **Publish the app** to Production (or Open Testing)
3. Remove any test accounts from License Testing if desired
4. Upload the production AAB with the same code

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "IAP not initialised" error | You're probably running in Expo Go. You need a **dev build** — see Step 6. |
| "No products found" | The Product ID in Play Console doesn't match `subscriptions.ts`. Check for typos. |
| "Item not available in your country" | The test account's country must match where the subscription is available. |
| "Purchase cancelled" when testing | Make sure you're signed into Google Play with the **same account** on both Play Store and test device. |
| "You already own this item" | Go to Play Store → Payments & Subscriptions → clear any test purchases. Or use the `license tester` role. |
| Price shows wrong currency | Google Play auto-detects region. The `priceLocalized` in code is just a fallback display. |
