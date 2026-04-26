---

# CommuteSmart — Complete Project Reference
> Last audited: 2026-04-25 15:30:00 (IST)
> Audited by: Agentic AI (full codebase read)
> Purpose: Single source of truth for all developers and AI agents

---

## 1. PROJECT OVERVIEW
CommuteSmart is a gamified transit tracking and alerting system that incentivizes green commuting in Punjab. Users can report traffic alerts, log their commutes using public transit, and earn points and badges for their eco-friendly actions. The platform calculates CO2 emissions saved compared to driving a car, fostering a greener community.

**Live URLs:**
- Frontend: https://commute-smart.vercel.app
- Backend: https://commutesmart.onrender.com
- GitHub Repo: https://github.com/Sukhpreet-Singh2428/CommuteSmart

**Tech Stack:**
| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, TailwindCSS, Framer Motion, Axios |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.IO |
| Auth | JWT (httpOnly Cookies), Google OAuth, GitHub OAuth |
| Hosting | Vercel (Frontend), Render (Backend) |

---

## 2. REPOSITORY STRUCTURE

### Backend (`/backend`)
- `index.js` — Main entry point, sets up Express, CORS, Socket.IO, DB connection
- `.env` — Environment variables
- `package.json` — Dependencies and scripts
- `config/passport.js` — Google and GitHub OAuth strategies configuration
- `middleware/authMiddleware.js` — JWT verification and user population
- `models/User.js` — User schema (gamification stats, auth info)
- `models/Report.js` — Alert schema (traffic alerts, comments, upvotes)
- `models/Trip.js` — Trip schema (route, distance, CO2 saved)
- `controllers/authController.js` — JWT auth, OAuth handlers, profile fetching
- `controllers/alertController.js` — Alert CRUD, upvotes, comments, gamification points
- `controllers/tripController.js` — Trip logging, gamification integration
- `controllers/userController.js` — User profile updating, individual stats fetching
- `controllers/leaderboardController.js` — Leaderboard fetching (sorted by points)
- `controllers/locationController.js` — Empty/unused location placeholder ⚠️
- `controllers/statsController.js` — Global live stats and trending areas logic
- `routes/authRoutes.js` — Auth routing and OAuth callbacks
- `routes/alerts.js` — Alert endpoints
- `routes/trips.js` — Trip logging endpoints
- `routes/userRoutes.js` — Profile management endpoints
- `routes/leaderboard.js` — Leaderboard endpoints
- `routes/location.js` — Empty placeholder ⚠️
- `routes/routes.js` — Empty placeholder ⚠️
- `routes/stats.js` — Global stats endpoints
- `scripts/fixCorruptArrayFields.js` — Utility script to repair corrupt MongoDB documents

### Frontend (`/frontend`)
- `package.json` — Dependencies and Vite config
- `src/main.tsx` — React root
- `src/App.tsx` — React Router setup, global providers
- `src/pages/Dashboard.tsx` — Main application dashboard (map, quick stats, route planner)
- `src/pages/Alerts.tsx` — Feed of community alerts
- `src/pages/Profile.tsx` — User profile, settings, individual stats
- `src/pages/Login.tsx` — Authentication login UI
- `src/pages/Register.tsx` — Authentication registration UI
- `src/pages/Landing.tsx` — Application landing page
- `src/pages/ForgotPassword.tsx` — Password reset flow
- `src/components/Navbar.tsx` — Main navigation header
- `src/components/PageNavbar.tsx` — Internal unified page navigation
- `src/components/ReportAlertModal.tsx` — Modal for creating new alerts
- `src/components/SafeMapView.tsx` — Map rendering and logic
- `src/components/OfflineIndicator.tsx` — Network status toaster
- `src/components/UserMenu.tsx` — Dropdown for user actions
- `src/components/ForgotPasswordModal.tsx` — Modal for password reset
- `src/components/PWAInstallPrompt.tsx` — Prompt to install as a PWA
- `src/components/ProtectedRoute.tsx` — React Router guard
- `src/context/AuthContext.tsx` — Global auth state and `/me` verification
- `src/context/RouteContext.tsx` — Global route state sharing
- `src/hooks/useSocket.ts` — Real-time Socket.IO integration
- `src/hooks/useUserStats.ts` — Fetch user-specific stats
- `src/hooks/useLiveStats.ts` — Fetch global community stats
- `src/hooks/useLocationService.ts` — Geolocation management
- `src/lib/api.ts` — Axios instance configuration and endpoint wrappers
- `src/types/index.ts` — TypeScript definitions
- `.env` — Local environment configuration
- `.env.production` — Production environment configuration

---

## 3. ENVIRONMENT VARIABLES

### Backend (`.env`)
| Variable | Value | Purpose | Required |
|---|---|---|---|
| `NODE_ENV` | `development` / `production` | Dictates cookie security (Lax vs None/Secure) | Yes |
| `PORT` | `5000` | Express server port | No |
| `MONGO_URL` | `[SECRET]` | MongoDB connection string | Yes |
| `JWT_SECRET` | `[SECRET]` | For signing auth tokens | Yes |
| `GOOGLE_CLIENT_ID` | `[SECRET]` | Google OAuth | Yes (if OAuth enabled) |
| `GOOGLE_CLIENT_SECRET` | `[SECRET]` | Google OAuth | Yes (if OAuth enabled) |
| `GOOGLE_CALLBACK_URL` | `http://localhost:5000/api/auth/google/callback` | Callback URI | Yes (if OAuth enabled) |
| `GITHUB_CLIENT_ID` | `[SECRET]` | GitHub OAuth | Yes (if OAuth enabled) |
| `GITHUB_CLIENT_SECRET` | `[SECRET]` | GitHub OAuth | Yes (if OAuth enabled) |
| `GITHUB_CALLBACK_URL` | `http://localhost:5000/api/auth/github/callback` | Callback URI | Yes (if OAuth enabled) |
| `CLIENT_URL` | `http://localhost:3000` or `https://commute-smart.vercel.app` | OAuth Redirect, CORS allowed origin | Yes |

### Frontend (`.env` / `.env.production`)
| Variable | Value | Purpose | Required |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` or `https://commutesmart.../api` | Base URL for Axios requests | Yes |
| `VITE_SOCKET_URL` | `http://localhost:5000` or `https://commutesmart...` | Base URL for Socket.IO | Yes |

---

## 4. COMPLETE API REFERENCE

### [POST] /api/auth/register
- Auth required: No
- Request body: `{ name, email, password }`
- Query params: None
- Response: `{ success, user }` (Sets JWT cookie)
- Status: ✅ Working
- Notes: Requires unique email

### [POST] /api/auth/login
- Auth required: No
- Request body: `{ email, password }`
- Query params: None
- Response: `{ success, user }` (Sets JWT cookie)
- Status: ✅ Working

### [POST] /api/auth/logout
- Auth required: Yes
- Request body: None
- Query params: None
- Response: `{ success, message }` (Clears JWT cookie)
- Status: ✅ Working
- Notes: Standardized cookie clearing flags based on `NODE_ENV`

### [GET] /api/auth/me
- Auth required: Yes
- Request body: None
- Query params: None
- Response: `{ success, user }`
- Status: ✅ Working
- Notes: Primary source of truth for AuthContext session state

### [GET] /api/auth/google (and /github)
- Auth required: No
- Request body: None
- Query params: None
- Response: Redirect to Provider
- Status: ✅ Working
- Notes: Uses passport strategy

### [GET] /api/auth/google/callback (and /github)
- Auth required: No
- Request body: None
- Query params: None
- Response: Redirects to `CLIENT_URL` (Sets JWT cookie)
- Status: ✅ Working

### [POST] /api/alerts
- Auth required: Yes
- Request body: `{ message, lat, long, type, severity, location, area, routeFrom, routeTo }`
- Query params: None
- Response: `{ success, alert }`
- Status: ✅ Working
- Notes: Awards points, emits socket event

### [GET] /api/alerts
- Auth required: No
- Request body: None
- Query params: `?page=1&limit=20`
- Response: `{ success, alerts, pagination }`
- Status: ✅ Working

### [GET] /api/alerts/nearby
- Auth required: No
- Request body: None
- Query params: `?lat=...&long=...&radius=...`
- Response: `{ success, alerts }`
- Status: ✅ Working

### [PATCH] /api/alerts/:id/upvote
- Auth required: Yes
- Request body: None
- Query params: None
- Response: `{ success, upvotes, userUpvoted }`
- Status: ✅ Working
- Notes: Toggles upvote. At 5 upvotes, awards 25 points to original reporter. Emits socket event.

### [POST] /api/alerts/:id/comments
- Auth required: Yes
- Request body: `{ text }`
- Query params: None
- Response: `{ success, comment, totalComments }`
- Status: ✅ Working
- Notes: Appends to comments array, emits socket event.

### [GET] /api/alerts/:id/comments
- Auth required: No
- Request body: None
- Query params: None
- Response: `{ success, comments }`
- Status: ✅ Working

### [DELETE] /api/alerts/:id
- Auth required: Yes (and must own alert)
- Request body: None
- Query params: None
- Response: `{ success, message }`
- Status: ✅ Working

### [POST] /api/trips
- Auth required: Yes
- Request body: `{ routeFrom, routeTo, distanceKm, transportMode, carbonSaved }`
- Query params: None
- Response: `{ success, trip, carbonSaved, points }`
- Status: ✅ Working
- Notes: Logs trip, awards 20 points, adds carbonSaved to User.

### [GET] /api/trips/me
- Auth required: Yes
- Request body: None
- Query params: None
- Response: `{ success, trips, stats }`
- Status: ✅ Working

### [GET] /api/stats/live
- Auth required: No
- Request body: None
- Query params: None
- Response: `{ success, stats: { activeAlerts, verifiedAlerts, totalContributors, avgResponseTime } }`
- Status: ✅ Working

### [GET] /api/stats/trending
- Auth required: No
- Request body: None
- Query params: None
- Response: `{ success, trending }`
- Status: ✅ Working

### [GET] /api/leaderboard
- Auth required: No
- Request body: None
- Query params: `?limit=50`
- Response: `{ success, leaderboard }`
- Status: ✅ Working

### [GET] /api/users/me/stats
- Auth required: Yes
- Request body: None
- Query params: None
- Response: `{ success, stats }`
- Status: ✅ Working

### [PATCH] /api/users/me/profile
- Auth required: Yes
- Request body: `{ name, username, city, bio, profilePhoto }`
- Query params: None
- Response: `{ success, user }`
- Status: ✅ Working

---

## 5. SOCKET.IO EVENT REFERENCE

| Event Name | Direction | Payload | Status |
|---|---|---|---|
| `alert:new` | Server → Client | Full Populated Alert Object | ✅ Working |
| `alert:upvoted` | Server → Client | `{ alertId, upvoteCount, upvotes }` | ✅ Working |
| `alert:comment:new` | Server → Client | `{ alertId, comment, totalComments }` | ✅ Working |
| `points:earned` | Server → Client | `{ points, reason, total }` | ✅ Working (Emitted to user room) |
| `badge:earned` | Server → Client | `{ badges }` | ✅ Working (Emitted to user room) |
| `join:personal` | Client → Server | `{ userId }` | ✅ Working |

---

## 6. DATABASE SCHEMAS

### User Model
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required if no google/github id)
- `googleId`, `githubId` (String, optional)
- `profilePhoto`, `username`, `city`, `bio` (String)
- `points` (Number, default 0)
- `carbonSaved` (Number, default 0)
- `honestyScore` (Number, default 100)
- `badges` (Array of Strings, default [])
- `lastActiveDate` (Date)
- *Indexes:* `email`

### Report Model (Alerts)
- `type` (String, default 'alert')
- `alertType` (String)
- `severity` (String, default 'medium')
- `message` (String, required)
- `location` (GeoJSON Point, required)
- `locationText`, `area`, `routeFrom`, `routeTo` (String)
- `reportedBy` (ObjectId ref User, required)
- `upvotes` (Array of Strings, user IDs)
- `upvoteCount` (Number, default 0)
- `verified` (Boolean, default false)
- `verifiedAt` (Date)
- `comments` (Array of objects: `{userId, userName, text, createdAt}`)
- *Indexes:* `location` (2dsphere)

### Trip Model
- `userId` (ObjectId ref User, required)
- `routeFrom`, `routeTo` (String, required)
- `distanceKm` (Number, required)
- `transportMode` (String, enum: bus, metro, bike, train, carpool)
- `carbonSaved` (Number, default 0)
- *Indexes:* `userId`

---

## 7. AUTHENTICATION FLOW

### JWT Email/Password Login
1. Client calls `POST /api/auth/login` with email/password (`frontend/src/pages/Login.tsx`)
2. Server validates password, creates JWT (`backend/controllers/authController.js`)
3. Server attaches JWT as `httpOnly` cookie with environment-aware SameSite/Secure flags
4. Response returns user data, frontend `AuthContext` updates state.

### OAuth Login (Google/GitHub)
1. User clicks OAuth button using `window.location.href = API_URL/api/auth/google`.
2. Passport strategy redirects to Provider.
3. Provider callbacks to `/api/auth/google/callback`.
4. Passport strategy finds/creates user.
5. Server sets JWT cookie (environment-aware).
6. Server redirects to `CLIENT_URL/dashboard`.
7. Frontend `AuthContext` mounts, calls `GET /api/auth/me`, grabs user from cookie.

### Session Persistence
- The app treats the `httpOnly` cookie as the single source of truth.
- `AuthContext` unconditionally fetches `GET /api/auth/me` on mount to rehydrate session across tabs and refreshes.

### Logout
- `POST /api/auth/logout` clears the cookie matching the environment-aware settings.

---

## 8. GAMIFICATION SYSTEM

| Action | Points Awarded | Carbon Equivalent | Handled In |
|---|---|---|---|
| Creating Alert | 10 | 0.01 kg | `alertController.createAlert` |
| Alert Verified (5 upvotes) | 25 | 0.04 kg | `alertController.upvoteAlert` |
| Verifying Alert (upvoting) | 5 | 0 | `alertController.upvoteAlert` |
| Logging a Trip | 20 | calculated per km | `tripController.createTrip` |
| Upvoting Alert (for Reporter)| 2 | 0.005 kg | `alertController.upvoteAlert` |

**Badge Conditions:**
- `First Report`: 1 alert created
- `Reliable Reporter`: 10 alerts created
- `Community Hero`: 50 alerts created
- `Verified Voice`: 5 verified alerts
- `Green Guardian`: 1 kg carbon saved
- `Eco Champion`: 10 kg carbon saved
- `Trip Starter`: 1 trip logged
*(Checked centrally in `checkAndAwardBadges` in controllers)*

**Level Formula:**
- 1000 XP (points) per level. Computed as `Math.floor(points / 1000) + 1`.

---

## 9. FRONTEND PAGES — TRUE CURRENT STATE

### `/dashboard` (Dashboard.tsx)
- Map, Route Planner: ✅ Dynamically wired to OSRM API + Nominatim Geocoding
- Live Alerts on Map: ✅ Dynamically wired to backend
- Quick Stats Panel: ✅ Dynamically wired to backend user object
- Travel Confirmation: ✅ Dynamically wired to `POST /api/trips`
- Community Feed (right side): ⚠️ Static placeholders used for feed visuals.

### `/alerts` (Alerts.tsx)
- Alert Feed: ✅ Dynamically wired to backend paginated API
- Upvoting: ✅ Dynamically wired to backend + real-time socket updates
- Commenting: ✅ Dynamically wired to backend + real-time socket updates
- Create Alert Modal: ✅ Dynamically wired

### `/profile` (Profile.tsx)
- Overview Stats: ✅ Dynamically wired to backend user object
- Settings (Profile Form): ✅ Dynamically wired to `PATCH /api/users/me/profile`
- Leaderboard panel: ✅ Dynamically wired with static fallback
- Achievements Tab: ⚠️ Static placeholders (unlocked logic mocked)
- Activity Tab: ⚠️ Static placeholders

### `/login` & `/register`
- Email/password flow: ✅ Working
- Google OAuth: ✅ Working
- GitHub OAuth: ✅ Working
- Apple OAuth: ❌ Fully Removed (as requested)

---

## 10. COMPONENTS REFERENCE

- **SafeMapView**: Wraps Leaflet map to prevent SSR issues and provide robust bounds rendering. (✅ Working)
- **UserMenu**: Dropdown in Navbar for profile links and logout. (✅ Working)
- **ReportAlertModal**: Modal UI for `POST /api/alerts`. Takes map coordinates. (✅ Working)
- **PageNavbar**: Unified shared navigation for all internal pages. (✅ Working)
- **ProtectedRoute**: React Router wrapper that awaits `AuthContext.isLoading` before gating unauthenticated users. (✅ Working)

---

## 11. HOOKS REFERENCE

- **useSocket**: Manages Socket.IO connection. Singleton pattern with cleanup. Listens for gamification events and populates toasts. (✅ Working)
- **useUserStats**: Fetches `/api/users/me/stats` for Profile page. Handles points animation state. (✅ Working)
- **useLiveStats**: Fetches `/api/stats/live` for Community page. (✅ Working)
- **useLocationService**: Provides HTML5 Geolocation. (✅ Working)

---

## 12. KNOWN BUGS AND STATUS

| # | Bug | Root Cause | Status | Fix Location |
|---|---|---|---|---|
| 1 | Express Server crashes on `options('*')` | Express 5 `path-to-regexp` v8 incompatibility | ✅ Fixed | `backend/index.js` (changed to `/(.*)/`) |
| 2 | `uniqueOrigins` ReferenceError on crash | Renamed variable missing in logging statement | ✅ Fixed | `backend/index.js` (changed to `allowedOrigins`) |
| 3 | Cross-origin Auth Cookies Failing | Render blocks cookies lacking `SameSite=None; Secure` | ✅ Fixed | `backend/controllers/authController.js` and `authRoutes.js` |
| 4 | OAuth callbacks stuck on loading | Frontend `localStorage` sync issue | ✅ Fixed | `frontend/src/context/AuthContext.tsx` |

---

## 13. COMPLETED WORK — SESSION BY SESSION

- **Phase 1**: Initial MVP with hardcoded mock data, React Router layout, and Tailwind designs.
- **Phase 2**: Backend creation, MongoDB connection, JWT logic, Alert endpoints, CORS setup.
- **Phase 3**: Gamification logic (Points, Badges), Live Stats endpoints, Trip endpoints.
- **OAuth Session**: Implemented Google & GitHub Passport Strategies. Replaced Apple mock buttons. Fixed `/me` fetching in `AuthContext` to support OAuth flow.
- **Cookie Session**: Fixed production cookie persistence by explicitly sending `SameSite=none` and `Secure=true` in `production`. Cleaned up verbose CORS code into standard middleware.

---

## 14. PENDING FEATURES

| Feature | Description | Files to touch | Backend ready? | Priority | Complexity |
|---|---|---|---|---|---|
| Dynamic Activity Tab | Replace static mock data in Profile with `/api/trips/me` | `Profile.tsx` | Yes | Medium | Low |
| Dynamic Achievements | Map user's array of `badges` to actual visual icons in Profile | `Profile.tsx` | Yes | Medium | Low |
| Dynamic Dashboard Feed | Replace static `punjabReports` array with real `routeAlerts` | `Dashboard.tsx` | Yes | High | Low |
| Notification Settings | Persist toggle state from Profile to backend | `User.js`, `Profile.tsx` | No | Low | Medium |

---

## 15. DESIGN SYSTEM

- **Color Palette**: 
  - Background: `#0a1411`
  - Accent/Primary: `#0fb880`
  - Text: White, `gray-400`
- **Typography**: Inter / Roboto (San-serif defaults)
- **Glassmorphism Recipe**: `bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl`
- **Animation (Framer Motion)**: Standard delays on stagger `0.1s`, `whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.95 }}`
- **Rules**: NEVER change the split-screen layout of Login/Register. NEVER alter the base background `#0a1411`.

---

## 16. DEPLOYMENT GUIDE

### Local Development
1. Start Backend: `cd backend && npm run dev`
2. Start Frontend: `cd frontend && npm run dev`
3. Backend runs on `localhost:5000`, Frontend on `localhost:3000` or `5173`.
4. Dev Env Needs: `NODE_ENV=development` in backend.

### Production Deployment
- **Frontend (Vercel)**: Set `VITE_API_URL=https://commutesmart.onrender.com/api` and `VITE_SOCKET_URL=https://commutesmart.onrender.com`.
- **Backend (Render)**: Set `NODE_ENV=production`. Set `CLIENT_URL=https://commute-smart.vercel.app`.
- **CORS Handling**: Backend uses strict origin array validation; Wildcard `*` will break auth cookies.

---

## 17. RULES FOR THE NEXT DEVELOPER OR AI AGENT

1. **Auth Single Source of Truth**: The `httpOnly` JWT cookie is king. Do NOT rely on `localStorage` for session locking. `AuthContext` must verify `/me` on load.
2. **CORS Configuration**: Do NOT use `cors({ origin: '*' })` or preflight headers manually. Stick to the `allowedOrigins` array in `index.js`.
3. **Mongoose Lean**: Always use `.lean()` on heavy `find()` queries for performance unless document manipulation (save) is required.
4. **Design Rules**: Retain the `#0fb880` primary accent. Use Framer Motion for all hover state logic. Retain glassmorphism on cards.
5. **Express Preflight**: Use `app.options(/(.*)/, cors())` for Express 5 compatibility.

---

## 18. QUICK REFERENCE CHEATSHEET

- **App**: CommuteSmart — gamified green transit app.
- **Working Features**: Email Auth, Google/GitHub OAuth, Live Map routing (OSRM), Creating Alerts, Upvoting/Commenting, Gamification logic, Leaderboard.
- **Missing Features**: Profile achievements and activity feed are still static visual placeholders.
- **Key Files**: `backend/index.js` (Server), `frontend/src/pages/Dashboard.tsx` (Core App), `frontend/src/context/AuthContext.tsx` (State).
- **The One Thing to Never Break**: Cross-site cookie configurations in `authController.js` (SameSite / Secure). Breaking this breaks login for the entire production app.

---
