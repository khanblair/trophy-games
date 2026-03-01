# Bet Titan

Bet Titan is a premium football prediction app built with React Native, Expo, and Tamagui.

## Features

-   **Premium UI**: Dark mode aesthetic with lime green accents (#D9FF00).
-   **Five Main Sections**:
    -   **Free Tips**: Daily free football predictions.
    -   **Paid Tips**: High-confidence predictions purchasable with coins.
    -   **VIP**: Exclusive access to premium tips and membership plans.
    -   **Wins**: History of successful predictions.
    -   **Market**: Buy coins and subscription packages.
-   **Sportmonks API Integration**: Real-time football data (fixtures, odds, predictions).
-   **Theme Support**: Toggle between Dark and Light modes.

## Tech Stack

-   **Framework**: [React Native](https://reactnative.dev/) with [Expo SDK 50+](https://expo.dev/).
-   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/).
-   **Styling**: [Tamagui](https://tamagui.dev/) for performant, themeable UI components.
-   **Language**: TypeScript.
-   **Package Manager**: Bun.
-   **Networking**: Axios.
-   **Icons**: Lucide React Native.

## Getting Started

1.  **Install Dependencies**:

    ```bash
    bun install
    ```

2.  **Start the Server**:

    ```bash
    bun start
    ```

3.  **Run on Device/Emulator**:
    -   Press `a` for Android Emulator.
    -   Press `i` for iOS Simulator.
    -   Scan the QR code with the Expo Go app on your physical device.

## Project Structure

-   `src/app`: Expo Router file-based routing.
-   `src/components`: Reusable UI components (e.g., `MatchCard`).
-   `src/theme`: Tamagui configuration and theme definitions.
-   `src/api`: API clients (Sportmonks).
-   `assets`: Images and fonts.

## Environment Variables

Create a `.env` file in the root directory and add your Sportmonks API token:

```env
EXPO_PUBLIC_SPORTMONKS_API_TOKEN=your_api_token_here
```

## Scripts

-   `bun start`: Start the Expo dev server.
-   `bun android`: Run on Android.
-   `bun ios`: Run on iOS.
-   `bun web`: Run on web.


fix the theme switching in my app, why is it only working on the header and not other screens and sections? find and fix this.
-also fix the navigation in the drawer menu in my app to link properly to the proper screens
-also in my apps, we and mobile, how bets can we fetch the flags and display them fot eh leagues and matches?
-in my mobile app add a filter for leagues
-in mobile app, remove the AI insights button and instead use the ones fetched from convex, generated from web, add this API if its missing.
-in mobile app, link paid, vip, wins screens to the macth detail screen
