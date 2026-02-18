# CommuteSmart

Real-time public transport optimizer for Punjab. Smart commutes, greener planet.

## Tech Stack

* **Vite** + **React 18** (TypeScript)
* **Tailwind CSS** - mobile-first, responsive
* **Framer Motion** - page transitions, hover effects
* **React-Leaflet** - interactive maps with pulsing markers
* **React Router** - navigation
* **Context API** - auth state (no Redux)
* **React Confetti** - badge celebrations
* **React Hot Toast** - notifications

## Setup

```bash
npm install
npm run dev
```

Open <http://localhost:3000>

## Build

```bash
npm run build
npm run preview
```

## Pages

| Route | Page |
|----|----|
| `/` | Landing - hero, features, CTA |
| `/login` | Login form |
| `/register` | Register form |
| `/dashboard` | Map, route search, carbon sheet |
| `/alerts` | Community alerts feed |
| `/profile` | Profile & achievements |

## Backend Stubs

API calls are stubbed. Connect to a real backend at `http://localhost:5000/api`:

* `POST /api/auth/login`
* `POST /api/auth/register`
* `POST /api/location/report` - `{ lat, long, vehicleId? }`
* `GET /api/location/nearby?lat=30.9&long=75.85`
* `GET /api/user/achievements`

## PWA

`public/manifest.json` is configured for installable PWA support.