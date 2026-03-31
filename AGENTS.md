# Trophy Games - AI Sports Predictions Platform

## Project Overview

Trophy Games is a full-stack sports analytics platform providing AI-powered football (soccer) predictions. The platform consists of a web admin dashboard, a React Native mobile app, and a Convex backend.

### Key Features
- **AI-Powered Predictions**: Machine learning models (via Groq API) analyze matches for betting insights
- **Multi-tier Access**: Free, Paid, and VIP match predictions with token-based access control
- **Real-time Data**: Live match scores from Goaloo and pre-match odds from The Odds API
- **Push Notifications**: Expo push notifications for new tips and alerts
- **Admin Dashboard**: Web interface for managing matches, tokens, and viewing analytics

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + Bun workspaces |
| **Web App** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Mobile App** | React Native, Expo SDK 54, Expo Router |
| **Backend** | Convex (serverless database + functions) |
| **Styling** | Tailwind CSS (web), Custom theme system (mobile) |
| **Icons** | Lucide React |
| **Notifications** | Expo Push Notifications |
| **Data Sources** | The Odds API, Goaloo Live |
| **AI** | Groq SDK |

## Project Structure

```
trophy-games/
├── apps/
│   ├── mobile/          # React Native app (Expo)
│   │   ├── src/
│   │   │   ├── app/     # Expo Router file-based routing
│   │   │   ├── components/
│   │   │   ├── context/ # ThemeContext
│   │   │   ├── theme/   # Color definitions
│   │   │   ├── api/     # API clients (Groq, Sportmonks, Web)
│   │   │   └── hooks/   # usePushNotifications
│   │   ├── assets/
│   │   ├── app.json     # Expo configuration
│   │   └── eas.json     # EAS Build configuration
│   └── web/             # Next.js admin dashboard
│       ├── app/         # App Router pages
│       ├── components/  # Sidebar, Modals, Layout
│       ├── lib/         # API utilities, storage
│       └── public/
├── packages/
│   ├── backend/         # Convex backend
│   │   └── convex/
│   │       ├── schema.ts    # Database schema
│   │       ├── matches.ts   # Match queries/mutations
│   │       ├── alerts.ts    # Push notification logic
│   │       ├── tokens.ts    # Access token management
│   │       └── devices.ts   # Push token registration
│   └── shared/          # Shared TypeScript types
│       └── index.ts     # MatchData, LeagueInfo interfaces
├── docs/
│   └── NOTIFICATIONS.md # Notification system documentation
├── scrape.ts            # Standalone scraper script (Bun)
└── package.json         # Root monorepo config
```

## Build & Development Commands

```bash
# Install dependencies (uses Bun)
bun install

# Development - start all apps
bun run dev

# Build all apps
bun run build

# Lint all apps
bun run lint

# Clean build artifacts
bun run clean

# Run scraper script
bun run scrape

# Mobile app only
cd apps/mobile
bun run dev          # Start Expo dev server
bun run android      # Run on Android
bun run ios          # Run on iOS

# Web app only
cd apps/web
bun run dev          # Start Next.js dev server (localhost:3000)
bun run build        # Build for production

# Backend (Convex)
cd packages/backend
bun run dev          # Start Convex dev server
```

## Environment Variables

### Mobile App (`apps/mobile/.env.local`)
```env
EXPO_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud
EXPO_PUBLIC_SPORTMONKS_API_TOKEN=your_token
EXPO_PUBLIC_WEB_API_URL=https://your-web-app.vercel.app
```

### Web App (`apps/web/.env.local`)
```env
CONVEX_DEPLOY_URL=https://your-convex-url.convex.cloud
ODDS_API_KEY=your_odds_api_key
GROQ_API_KEY=your_groq_api_key
CRON_SECRET=your_cron_secret
```

### Backend (`packages/backend/.env.local`)
```env
# Convex handles its own env vars via dashboard
# Go to https://dashboard.convex.dev for configuration
```

## Database Schema (Convex)

### Tables

**`matches`** - Football match data
- Core fields: `id`, `league`, `homeTeam`, `awayTeam`, `timestamp`, `status`, `score`
- AI data: `aiPrediction` (prediction, confidence, reasoning, suggestedBet)
- Odds: `odds`, `detailedOdds` (ft/ht, 1x2/ou/ah)
- H2H: `h2h` (head-to-head statistics)
- Categorization: `matchType` ('free' | 'paid' | 'vip' | 'unassigned'), `isTrending`
- History tracking: `result` ('win' | 'lose' | 'draw'), `isHistory`
- Media: `leagueLogo`, `homeTeamLogo`, `awayTeamLogo`, `countryFlag`

**`leagues`** - League information
- `id`, `name`, `url`, `type`, `country`, `logo`

**`accessTokens`** - VIP/Paid access tokens
- `token`, `matchId`, `deviceId`, `type`, `expiresAt`, `isActive`, `isClaimed`

**`membershipRequests`** - User upgrade requests
- `deviceId`, `type`, `status` ('pending' | 'approved' | 'rejected'), `token`

**`devices`** - Push notification tokens
- `deviceId`, `pushToken`, `lastActiveAt`

**`alerts`** - In-app notifications
- `deviceId`, `title`, `body`, `data`, `readBy`

## Code Style Guidelines

### TypeScript
- Strict mode enabled across all packages
- Use explicit return types for exported functions
- Prefer interfaces over type aliases for object shapes

### Naming Conventions
- **Components**: PascalCase (e.g., `MatchCard.tsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE or PascalCase for exported constants
- **Environment Variables**: EXPO_PUBLIC_* for client-exposed, no prefix for server-only

### Mobile App (Expo)
- Use Expo Router for navigation (file-based routing)
- Theme colors defined in `src/theme/colors.ts` (dark/light modes)
- Access theme via `useTheme()` hook from `ThemeContext`
- All screens must respect theme (background, text, border colors)

### Web App (Next.js)
- App Router structure with `page.tsx` files
- Client components use `'use client'` directive
- Tailwind CSS for styling with dark mode support
- `cn()` utility from `clsx` + `tailwind-merge` for conditional classes

### Backend (Convex)
- One file per domain (matches.ts, tokens.ts, etc.)
- Use validators (`v.string()`, `v.optional()`, etc.) for all args
- Indexes defined in schema for query optimization
- Use `ctx.scheduler.runAfter()` for async side effects (notifications)

## Testing Instructions

Currently, the project relies on manual testing:

1. **Web Dashboard**: Navigate through all routes, verify data sync
2. **Mobile App**: Test on both iOS and Android via Expo Go
3. **Push Notifications**: Use the Alerts screen to verify token registration
4. **Data Sync**: Trigger sync from dashboard, verify data appears in mobile

## Data Sync Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  The Odds API   │────▶│  Web API Routes │────▶│  Convex DB      │
│  (Pre-match)    │     │  (/api/sync)    │     │  (matches)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
┌─────────────────┐           │                  ┌─────────────────┐
│  Goaloo Live    │───────────┘                  │  Mobile App     │
│  (Live scores)  │     ┌─────────────────┐◀────│  (React Native) │
└─────────────────┘     │  Groq AI        │     └─────────────────┘
                        │  (Predictions)  │              │
                        └─────────────────┘              │
                                                         ▼
                                                  ┌─────────────────┐
                                                  │  Expo Push      │
                                                  │  Notifications  │
                                                  └─────────────────┘
```

### GitHub Actions Workflow
`.github/workflows/scrape.yml` - Automated data sync every 5 minutes

## Security Considerations

1. **API Keys**: Never commit API keys to git. Use environment variables.
2. **CRON_SECRET**: Protects `/api/sync` endpoint from unauthorized access
3. **Convex**: Production data access controlled via Convex dashboard permissions
4. **Token System**: Access tokens are device-bound and can be revoked
5. **Data Validation**: All Convex mutations use validators to prevent malformed data

## Key Files for Common Tasks

| Task | File(s) |
|------|---------|
| Add new API endpoint (web) | `apps/web/app/api/*/route.ts` |
| Add Convex query/mutation | `packages/backend/convex/*.ts` |
| Update database schema | `packages/backend/convex/schema.ts` |
| Add mobile screen | `apps/mobile/src/app/*.tsx` |
| Update theme colors | `apps/mobile/src/theme/colors.ts` |
| Modify match card UI | `apps/mobile/src/components/MatchCard.tsx` |
| Update navigation | `apps/web/components/sidebar.tsx` |
| Add notification type | `packages/backend/convex/alerts.ts` |

## External APIs & Data Sources

| Source | Purpose | Rate Limits |
|--------|---------|-------------|
| The Odds API | Pre-match odds | Check dashboard |
| Goaloo (goaloo.com) | Live match scores | Unknown |
| Groq API | AI predictions | Check Groq dashboard |
| Sportmonks | League/team data (mobile) | Token-based |

## Deployment

### Web (Vercel)
- Connect GitHub repo to Vercel
- Set environment variables in Vercel dashboard
- Auto-deploys on push to main branch

### Mobile (EAS)
```bash
cd apps/mobile
# Development build
eas build --profile development
# Production build
eas build --profile production
```

### Backend (Convex)
```bash
cd packages/backend
npx convex deploy
```

## Troubleshooting

**Convex client not initialized (Mobile)**
- Check `EXPO_PUBLIC_CONVEX_URL` is set in `.env.local`
- Verify the URL format: `https://<project>.convex.cloud`

**Push notifications not working**
- Ensure `usePushNotifications` hook is mounted in `_layout.tsx`
- Check device token is registered in Convex `devices` table
- Verify Expo Push Notifications are configured in app.json

**Theme not applying consistently**
- Always use `themeColors` from `useTheme()` hook
- Don't hardcode colors; reference `colors.dark` or `colors.light`

**Data sync issues**
- Check GitHub Actions logs for scrape workflow
- Verify `CRON_SECRET` matches between GitHub and Vercel
- Check `/api/sync` endpoint returns 200
