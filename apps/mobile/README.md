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


in my project, i have the web and mobile. analyze and understand how each of them works. in the web i fetch matches and match data byt scrapping them from a website. then in the mobile app i want to have web APIs that push this data in the mobile app. i want to use this groq api 'EXPO_PUBLIC_GROQ_API_KEY' for AI predictions in the app as well. i want you to align the app with the data from the web, in the app: 
- display the matches and their details, 
- match predictions and AI insights as well
- show the paid, vip, etc... matches in the respective screens
- in the wins screen, show the history for given matches

in the web:
- add a section to mark matches as paid, free, vip or all; this will be used in the app
- fecth the most trending leagues for example English Premier League  at 'https://football.goaloo.com/league/36',  German Bundesliga  at 'https://football.goaloo.com/league/8' among others...

