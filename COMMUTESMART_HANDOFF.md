## Project: CommuteSmart
**What it is:** CommuteSmart is a crowd-sourced public transport tracker and eco-mobility platform tailored for Punjab cities. It empowers users to report real-time transit alerts (delays, traffic, accidents), plan greener routes, and gamifies the experience by awarding points, levels, and badges for eco-friendly commuting and active community participation.

**Live URLs:**
- Frontend: https://commute-smart.vercel.app
- Backend: https://commutesmart.onrender.com
- Repository: https://github.com/Sukhpreet-Singh2428/CommuteSmart

**Tech Stack:**
- Frontend: React 18.2.0, Vite 5.0.10, TailwindCSS 3.4.0, Socket.io-client 4.7.2, Framer-motion 10.16.16, React-leaflet 4.2.1
- Backend: Express 5.2.1, Mongoose 9.2.1, Socket.io 4.8.3, JWT, bcrypt
- Database: MongoDB Atlas
- Cache: None
- Real-time: Socket.IO
- Auth: JWT (HTTP-only cookies)
- Hosting: Vercel (frontend) + Render (backend)

---

### SECTION 2: REPOSITORY STRUCTURE

```
CommuteSmart/
├── backend/
│   ├── controllers/
│   │   ├── alertController.js       - Handles alert CRUD, upvoting, commenting, and gamification badge checks
│   │   ├── authController.js        - Handles user signup, login, JWT issuance, logout, and getMe
│   │   ├── leaderboardController.js - Retrieves top contributors sorted by points
│   │   ├── locationController.js    - Handles location reporting and nearby buses retrieval
│   │   ├── statsController.js       - Aggregates live system stats and trending areas based on alert density
│   │   ├── tripController.js        - Handles confirmed trip logging, carbon calculation, and trip history
│   │   └── userController.js        - Manages user favourites, profile updates, and comprehensive user stats aggregation
│   ├── middleware/
│   │   └── authMiddleware.js        - Protects routes by validating JWT cookies
│   ├── models/
│   │   ├── Report.js                - Mongoose schema for alerts/reports and comments
│   │   ├── Trip.js                  - Mongoose schema for user travel history and carbon savings
│   │   └── User.js                  - Mongoose schema for user profile, gamification stats, and authentication
│   ├── routes/
│   │   ├── alerts.js                - Routes for alert CRUD and community interactions
│   │   ├── authRoutes.js            - Routes for user authentication
│   │   ├── leaderboard.js           - Routes for leaderboard retrieval
│   │   ├── location.js              - Routes for geolocation updates
│   │   ├── routes.js                - Routes for route suggestion and standalone carbon calculations
│   │   ├── stats.js                 - Routes for platform-wide metrics
│   │   ├── trips.js                 - Routes for trip logging and history
│   │   └── userRoutes.js            - Routes for profile management and user-specific stats
│   ├── scripts/
│   │   └── fixCorruptArrayFields.js - Production migration script replacing corrupted scalars with empty arrays
│   ├── index.js                     - Entry point: configures CORS, parses cookies, connects MongoDB, mounts routes, and initializes Socket.IO
│   └── package.json                 - Backend dependencies and scripts
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Alerts.tsx           - Community feed, trending areas, top contributors, live statistics, and nearby alerts
│   │   │   ├── Dashboard.tsx        - Route planner, map view, eco dashboard, and alert creation modal
│   │   │   └── Profile.tsx          - User stats, achievements, recent activity, and profile settings editor
│   │   ├── components/
│   │   │   ├── Navbar.tsx           - Main navigation bar
│   │   │   ├── PageNavbar.tsx       - Contextual secondary navigation for specific pages
│   │   │   ├── OfflineIndicator.tsx - Network connectivity alert banner
│   │   │   ├── ReportAlertModal.tsx - Unified modal for submitting detailed alerts
│   │   │   ├── SafeMapView.tsx      - Error-bounded leaflet map component
│   │   │   └── UserMenu.tsx         - User dropdown menu for quick actions
│   │   ├── hooks/
│   │   │   ├── useLiveStats.ts      - Polls and tracks live community statistics and trending areas
│   │   │   ├── useLocationService.ts- Interfaces with navigator.geolocation
│   │   │   ├── useSocket.ts         - Manages singleton Socket.IO connection and event listeners
│   │   │   └── useUserStats.ts      - Fetches comprehensive user metrics for the profile dashboard
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      - Global state for authenticated user, caching to localStorage
│   │   │   └── RouteContext.tsx     - Global state for active routes
│   │   ├── lib/
│   │   │   └── api.ts               - Axios singleton and exported API wrappers (authAPI, locationAPI, alertsAPI, leaderboardAPI, userAPI, tripsAPI, statsAPI, routesAPI)
│   │   └── types/
│   │       └── index.ts             - TypeScript interfaces for models and API responses
│   └── package.json                 - Frontend dependencies, scripts, and Vite config
```

---

### SECTION 3: COMPLETE API REFERENCE

## REST Endpoints

### Auth
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | /api/auth/signup   | No | {email, password, name} | {success, token, user} |
| POST | /api/auth/login    | No | {email, password}       | {success, token, user} |
| GET  | /api/auth/me       | Yes | -                      | {success, user} |
| POST | /api/auth/logout   | Yes | -                      | {success, message} |

### Alerts / Reports
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST   | /api/alerts | Yes | {message, lat, long, type, severity, location, area, routeFrom, routeTo} | {success, alert} |
| GET    | /api/alerts | No | Query: page, limit | {success, data, pagination} |
| GET    | /api/alerts/nearby | No | Query: lat, long, radius | {success, data} |
| GET    | /api/alerts/route | No | Query: startLat, startLong, endLat, endLong | {success, data} |
| PATCH  | /api/alerts/:id/upvote | Yes | - | {success, upvotes, userUpvoted} |
| POST   | /api/alerts/:id/comments | Yes | {text} | {success, comment} |
| GET    | /api/alerts/:id/comments | No | - | {success, comments} |
| DELETE | /api/alerts/:id | Yes | - | {success, message} |

### Users
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET    | /api/users/me/stats | Yes | - | {success, stats: {points, carbonSaved, badges, honestyScore, totalReports, verifiedReports, ...}} |
| PATCH  | /api/users/me/profile | Yes | {name, username, bio, city, profilePhoto} | {success, user} |
| GET    | /api/users/me/favourites | Yes | - | {success, favourites} |
| POST   | /api/users/me/favourites | Yes | {routeId} | {success, favourites} |
| DELETE | /api/users/me/favourites/:routeId | Yes | - | {success, favourites} |

### Stats
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET    | /api/stats/live | No | - | {success, stats: {activeAlerts, verifiedAlerts, totalContributors, avgResponseTime}} |
| GET    | /api/stats/trending | No | - | {success, trending: [{area, level, alertCount}]} |

### Leaderboard
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET    | /api/leaderboard | No | Query: limit | {success, leaderboard} |

### Trips
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST   | /api/trips | Yes | {routeFrom, routeTo, distanceKm, transportMode, carbonSaved} | {success, trip, carbonSaved, points} |
| GET    | /api/trips/me | Yes | - | {success, trips, stats} |

### Location & Routes
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST   | /api/location/report | Yes | {lat, long, vehicleId} | {success, location} |
| GET    | /api/location/nearby | Yes | Query: lat, long | {success, vehicles} |
| POST   | /api/routes/suggest | No | {startLat, startLong, endLat, endLong} | {success, routes} |
| POST   | /api/routes/calculate-carbon | No | {distance, mode} | {success, carbonSaved} |

---

### SECTION 4: COMPLETE SOCKET.IO EVENT REFERENCE

## Socket.IO Events

### Server → All Clients (broadcast)
| Event | Payload | When emitted |
|-------|---------|--------------|
| alert:new / newAlert | {full populated alert object} | When any user creates an alert |
| alert:upvoted | {alertId, upvoteCount, upvotes} | When any user toggles an upvote |

### Server → Single User (personal room: `user:{userId}`)
| Event | Payload | When emitted |
|-------|---------|--------------|
| points:earned | {points, reason, total} | When user earns points (alert submit, verification, trip log) |
| badge:earned | {badges: string[]} | When user unlocks badge(s) |

### Client → Server
| Event | Payload | What it does |
|-------|---------|--------------|
| (Implicit Connect) | - | Establishes websocket connection |

---

### SECTION 5: DATABASE SCHEMAS (ACTUAL CURRENT STATE)

## User Model (`users` collection)
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| name | String | '' | |
| username | String | null | sparse unique |
| bio | String | '' | |
| city | String | 'Chandigarh' | |
| profilePhoto | String | '' | Base64 data URL |
| email | String | - | required, unique |
| password | String | - | required, hashed |
| favourites | [String] | [] | |
| points | Number | 0 | |
| carbonSaved | Number | 0 | |
| badges | [String] | [] | |
| honestyScore | Number | 100 | |
| lastActiveDate | Date | null | |
| createdAt | Date | Date.now | |

## Report/Alert Model (`reports` collection)
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| type | String | - | enum: ['location', 'alert'], required |
| alertType | String | 'traffic' | enum: ['traffic', 'accident', 'delay', 'construction', 'weather', 'info', 'clear', 'general'] |
| severity | String | 'medium' | enum: ['low', 'medium', 'high', 'critical'] |
| location | Object | {type: 'Point', coordinates: []} | 2dsphere index |
| locationText | String | '' | |
| area | String | '' | |
| routeFrom | String | '' | |
| routeTo | String | '' | |
| vehicleId | String | - | |
| message | String | - | |
| upvotes | [ObjectId] | [] | Refs 'User' |
| upvoteCount | Number | 0 | Legacy/deprecated field |
| comments | [Object] | [] | Array of {userId, userName, text, createdAt} |
| reportedBy | ObjectId | - | Refs 'User' |
| timeStamp | Date | Date.now | |

## Trip Model (`trips` collection)
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| userId | ObjectId | - | Refs 'User', required |
| routeFrom | String | - | required |
| routeTo | String | - | required |
| distanceKm | Number | - | required |
| transportMode | String | 'bus' | enum: ['bus', 'metro', 'bike', 'walk'] |
| carbonSaved | Number | 0 | |
| createdAt | Date | Date.now | |

---

### SECTION 6: GAMIFICATION SYSTEM

## Points System
| Action | Points Awarded | Where in code |
|--------|---------------|---------------|
| Submit an alert | +10 | alertController.js (createAlert) |
| Alert gets verified | +25 | alertController.js (upvoteAlert) |
| Verify someone's alert | +5 | alertController.js (upvoteAlert) |
| Get upvoted | +2 | alertController.js (upvoteAlert) |
| Confirm a trip | +20 | tripController.js (createTrip) |

## Carbon Calculation
| Action | CO2 Saved | Formula / Where in code |
|--------|-----------|---------|
| Submit an alert | +0.01 kg | alertController.js (createAlert) |
| Alert gets upvoted | +0.005 kg | alertController.js (upvoteAlert) |
| Alert gets verified | +0.04 kg additional | alertController.js (upvoteAlert) |
| Confirm a trip | Variable | tripController.js (createTrip) reads from frontend calculation |

## Badge System
| Badge ID | Unlock Condition | Checks |
|----------|-----------------|--------|
| First Report | 1 alert submitted | alertController.js & tripController.js |
| Reliable Reporter | 10 alerts submitted | alertController.js & tripController.js |
| Community Hero | 50 alerts submitted | alertController.js & tripController.js |
| Verified Voice | 5 alerts verified | alertController.js |
| Green Guardian | carbonSaved >= 1kg | alertController.js & tripController.js |
| Eco Champion | carbonSaved >= 10kg | alertController.js & tripController.js |
| Trip Starter | 1 trip confirmed | tripController.js |

## Level System
- 1000 XP per level
- level = Math.floor(points / 1000) + 1
- levelProgressPct = (points % 1000) / 10

---

### SECTION 7: FRONTEND PAGES — WHAT IS WIRED AND WHAT IS STILL STATIC

## Dashboard.tsx
**Route:** /dashboard (or /)
**Data sources:**
- Route Planner: Calculates routes via `routesAPI.suggestRoutes`.
- Eco Dashboard CO2 OFFSET: Reads from `user.carbonSaved` in `AuthContext` (DYNAMIC ✅).
- Eco Dashboard REWARD TOKENS: Reads from `user.points` in `AuthContext` (DYNAMIC ✅).
- Eco Dashboard DAILY PROGRESS bar: Static placeholder currently.
- Community Feed panel: Static placeholder objects currently.
- Travel Confirmation card: Not implemented.

## Alerts.tsx (Community page)
**Route:** /alerts or /community
**Data sources:**
- Live Statistics panel: `GET /api/stats/live` (DYNAMIC ✅)
- Top Contributors: `GET /api/leaderboard?limit=3` (DYNAMIC ✅)
- Trending Areas: `GET /api/stats/trending` (DYNAMIC ✅)
- Community Feed: `GET /api/alerts` (DYNAMIC ✅)
- Verified tab count badge: Dynamic from filtered alerts array (DYNAMIC ✅)
- Nearby tab: Geolocation filter implemented (DYNAMIC ✅)
- Upvote button: Wired to `PATCH /api/alerts/:id/upvote` (DYNAMIC ✅)
- Comment section: API endpoints exist (`addComment`), frontend UI not implemented yet.
- Share button: Not implemented.
- Eco Challenge Join Now: Static placeholder.

## Profile.tsx
**Route:** /profile
**Tabs:** Overview | Achievements | Activity | Settings
**Data sources:**
- XP progress bar: `GET /api/users/me/stats` via `useUserStats` (DYNAMIC ✅)
- Weekly progress chart: Dynamic from stats API (DYNAMIC ✅)
- Current streak: Dynamic from stats API (DYNAMIC ✅)
- Eco Impact panel: Dynamic from stats API (DYNAMIC ✅)
- Quick Stats: Dynamic from stats API (DYNAMIC ✅)
- Leaderboard: Hardcoded mock data currently in `leaderboardData` array placeholder.
- Achievements tab badges: Static placeholder array.
- Activity tab: Static placeholder array.
- Settings tab: Fully editable name, username, bio, city, profilePhoto (base64) — wired to `PATCH /api/users/me/profile` (DYNAMIC ✅)
  - CORS issue status: FIXED on both localhost and production Render environments.

---

### SECTION 8: KNOWN BUGS AND THEIR STATUS

## Bug Log

| # | Bug | Root Cause | Status | Fix Applied |
|---|-----|-----------|--------|-------------|
| 1 | GET /api/stats/live → 500 | upvotes field stored as int in Report collection | FIXED | `fixCorruptArrayFields.js` migration + `.lean()` + `countDocuments` in `statsController` |
| 2 | GET /api/users/me/stats → 500 | `$size` aggregation operator called on int field | FIXED | `$cond` `$isArray` guard on all `$size` calls |
| 3 | PATCH /api/users/me/profile → CORS blocked (localhost) | PATCH not in allowed methods list | FIXED | Added PATCH to cors methods array in `index.js` |
| 4 | PATCH /api/users/me/profile → CORS blocked (production) | commute-smart.vercel.app not in allowed origins | FIXED | Added Vercel URL to array + `CLIENT_URL` env var parsing + explicit `app.options('*')` preflight |
| 5 | Nearby tab crashes page | navigator.geolocation null reference on alerts without lat/lng | FIXED | Wrapped in try/catch, skips alerts without coordinates |
| 6 | PATCH /api/alerts/:id/upvote → 500 | `upvotes.includes()` called on int | FIXED | `Array.isArray` guard before array operations in controller |
| 7 | user.name shows empty string | authController not returning name field | FIXED | authController updated |

---

### SECTION 9: ENVIRONMENT VARIABLES

## Backend (.env on Render)
| Variable | Value | Purpose |
|----------|-------|---------|
| MONGO_URI / DATABASE_URL | mongodb+srv://... | MongoDB Atlas connection string |
| JWT_SECRET | [secret] | JWT signing key |
| PORT | 5000 | Express server port |
| CLIENT_URL | https://commute-smart.vercel.app | CORS allowed origin dynamically loaded |
| CLIENT_URL_PREVIEW | [optional vercel branch] | Vercel preview environments origin |

## Frontend (.env on Vercel or frontend/.env)
| Variable | Value | Purpose |
|----------|-------|---------|
| VITE_API_URL | https://commutesmart.onrender.com/api | Backend base URL |
| VITE_SOCKET_URL | https://commutesmart.onrender.com | Socket.IO connection URL |
*(Note: If VITE_API_URL is missing, `api.ts` safely falls back to http://localhost:5000)*

---

### SECTION 10: WHAT IS NOT YET IMPLEMENTED (PENDING WORK)

## Pending Features

| Feature | Description | Files to touch | Priority |
|---------|-------------|---------------|----------|
| Travel Confirmation card | Inline card shown after route calculation asking "Are you travelling this route?" | Dashboard.tsx | High |
| Trip distance tracking | Route Planner calculates a route — need to pass distanceKm to POST /api/trips | Dashboard.tsx, tripController.js | High |
| Comment section on alerts | POST /api/alerts/:id/comments backend exists, needs inline accordion UI | Alerts.tsx | Medium |
| Activity tab on Profile | Fetch and render from GET /api/trips/me | Profile.tsx | Medium |
| Profile Leaderboard list | Fetch and map data from GET /api/leaderboard | Profile.tsx | Medium |
| Share button on alerts | Web Share API implementation | Alerts.tsx | Low |
| Eco Challenge Join Now | Track challenge acceptance and progress state | Alerts.tsx, userController.js | Low |
| Real-time Map Dashboard alerts | The Community Feed panel in Dashboard.tsx needs wiring to the real Socket feed | Dashboard.tsx | Medium |

---

### SECTION 11: HOW TO RUN LOCALLY

## Local Development Setup

### Prerequisites
- Node.js
- MongoDB local instance or Atlas URI
- Git

### Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI and JWT_SECRET
npm run dev                 # runs nodemon on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# Create .env with VITE_API_URL=http://localhost:5000/api
npm run dev                 # runs Vite on http://localhost:3000 or 5173
```

### Migrations (Data fixing)
If running against production or dirty legacy dev DB:
```bash
node backend/scripts/fixCorruptArrayFields.js
```

---

### SECTION 12: CONVENTIONS AND RULES FOR THE NEXT AI AGENT

## Rules the Next Agent Must Follow

### Design
- NEVER change any color, font, spacing, Tailwind class, or layout.
- NEVER remove or modify Framer Motion animation variants.
- Aesthetic: Dark background (`#0a1411`), green accents (`#0fb880`), modern glassmorphism.
- All new UI elements must strictly match this aesthetic.

### Code
- TypeScript strict — avoid `any` types and `@ts-ignore`.
- API functions must be defined in `frontend/src/lib/api.ts`.
- Hooks go in `frontend/src/hooks/`, components in `frontend/src/components/`, interfaces in `frontend/src/types/index.ts`.
- Clean up all socket event listeners inside `useEffect` return functions using `socket.off()`.

### Backend
- Ensure Mongoose `countDocuments()` is used for counters.
- Ensure `.lean()` is used on Mongoose queries when document methods are not needed.
- Enclose all controller methods in robust `try...catch` blocks.
- Points and gamification logic must remain entirely server-side.

### CORS
- Maintain `cors()` and explicit `app.options('*')` configurations exactly as set up.

---

### SECTION 13: SESSION HISTORY SUMMARY

## What Was Built — Session by Session

### Phase 1 — Backend ↔ Frontend Wiring
- JWT authentication fully wired (register, login, me, logout).
- Socket.IO singleton hook (`useSocket.ts`) implemented with lifecycle cleanup.
- API client wrapper constructed with Axios interceptors.
- Basic Alerts CRUD connected to frontend views.

### Phase 2 — Dynamic Data + Gamification Engine
- Gamification foundation implemented: Badges, Level metrics, Streaks, Points logic.
- Live statistics aggregation endpoints built (`/api/stats/live`, `/api/stats/trending`).
- Comprehensive user metrics pipeline built (`/api/users/me/stats`).
- Profile Overview and Community Statistics frontend panels dynamically wired.

### Phase 3 — Route Carbon + Report Modal + Profile Editor + Community Interactions
- Refined ReportAlertModal added allowing 6 types, severities, and mapping coordinates.
- Upvote feature toggle built and integrated with real-time socket events.
- Fully editable Profile Settings tab established (Base64 avatar, name, bio).
- Fixed major data typing crashes (integer vs array corruptions on production DB).
- Fixed crucial CORS network blockers to ensure seamless Vercel ↔ Render communication.
