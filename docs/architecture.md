# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- **Presentation tier decision**: React component pages for Activities, Teams, Leaderboard, and Workout suggestions; each page fetches from `/api/*` endpoints and renders lists with optional create forms. Use Bootstrap for styling and React Router for navigation.
- **Logic tier decision**: Express routes with TypeScript service functions; each route validates input (reject 4xx for invalid data), calls services for business logic, and returns JSON. Keep routes thin—validation and computation in services.
- **Data tier decision**: Mongoose schemas with built-in validation (required fields, types); models in separate files. Seed script uses upserts to maintain stable demo data across runs without clearing collections.
- **Activity tracking approach**: User submits `userId`, `teamId`, `type`, `minutes`; service validates IDs exist, computes `points` (minutes/10 rounded), sets `occurredAt` to now. POST returns 400 if IDs invalid, 201 if created.
- **Team management approach**: User submits `name` and `mascot`; service validates `name` is required, rejects with 400 if missing. Team document stores `name`, `mascot`, and `members` array (populated from seed or POST). GET lists all teams with their members.
- **Leaderboard approach**: Aggregate activities by team, sum points, sort descending, add 1-based rank. Return array of `{ teamName, totalPoints, rank }`. GET `/api/leaderboard` groups by team and computes totals in service or MongoDB aggregation.
- **Workout suggestions approach**: User provides email; service finds seeded user, queries their recent activities (last 30 days), analyzes `type` and `goal`, recommends workout with matching `focus` and `reason` explaining the connection. Return 404 if email not found.

## Test plan

Record the commands you run and what each failure means.

- **Data-tier command**: `npm run test:data --prefix octofit-tracker/backend`
  - Validates User, Team, Activity, Workout schemas. Expect 4 failures (missing validation) → 5 passing after data models implemented.
- **API command**: `npm run test:api --prefix octofit-tracker/backend`
  - Validates endpoints: POST/GET activities (validate invalid input returns 400), POST/GET teams (name required, 400 if missing), GET leaderboard (ranked by points), GET suggestions (match focus to activity). Expect 4 failures (501 not implemented) → 4 passing after services implemented.
- **Frontend command**: `npm test --prefix octofit-tracker/frontend`
  - Validates React components render API data. Expect 15 failures ("Implementation pending" placeholder text) → 15 passing after pages connect to API endpoints.
- **Backend build command**: `npm run build --prefix octofit-tracker/backend`
  - Compiles TypeScript, validates no type errors. Run after services complete.
- **Frontend build command**: `npm run build --prefix octofit-tracker/frontend`
  - Bundles React with Vite. Run after all pages implemented and backend ready.
