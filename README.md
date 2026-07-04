# Campaign Monitoring & Telegram Alert System

A production-ready MERN stack system that monitors Google Ads CPS campaigns,
landing page traffic, and GCLID activity every minute, evaluates configurable
rules, and sends Telegram alerts with optimization recommendations.

## Folder Structure

```
campaign-monitoring/
├── server/                     # Node.js + Express backend (MVC)
│   ├── src/
│   │   ├── config/             # env.js, db.js
│   │   ├── models/             # CampaignMetrics, LandingClicks, GclidLogs, AlertRules,
│   │   │                       # AlertHistory, User (auth/roles), Campaign (assignment registry)
│   │   ├── controllers/        # campaign, tracking, alert, rule, auth, user controllers
│   │   ├── routes/             # Express routers
│   │   ├── services/           # googleAdsService, landingClickService, gclidService,
│   │   │                       # ruleEngine, recommendationEngine, alertService,
│   │   │                       # telegramService, authService
│   │   ├── jobs/                # campaignMonitorJob.js (node-cron)
│   │   ├── middlewares/         # asyncHandler, errorHandler, authMiddleware (requireAuth/requireRole)
│   │   ├── utils/                # logger, requestIp, seedAlertRules, seedAdminUser
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── client/                      # React (Vite) dashboard
│   ├── src/
│   │   ├── components/          # CampaignCard, CampaignTable, AlertHistoryTable, StatusBadge,
│   │   │                        # Sidebar, PageHeader, Layout, ProtectedRoute
│   │   ├── pages/                # OverviewPage, AlertHistoryPage, RulesPage, UsersPage,
│   │   │                         # ProfilePage, Login
│   │   ├── context/               # AuthContext (role-aware session)
│   │   ├── services/              # api.js
│   │   ├── hooks/                  # usePolling.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+
- A MongoDB instance (local `mongod` or a MongoDB Atlas connection string)
- A Telegram bot token (create one via [@BotFather](https://t.me/BotFather)) and your chat ID

### Troubleshooting: Atlas connection fails with a DNS/SRV error

Some networks (restrictive routers, corporate DNS, some ISPs) block the DNS
`SRV`/`TXT` lookups that `mongodb+srv://` connection strings depend on,
failing with something like `querySrv ECONNREFUSED _mongodb._tcp....`. Fix:
use Atlas's **standard connection string** instead of the shortened SRV one.

1. In Atlas, click **Connect** on your cluster → **Drivers** → look for a
   "standard connection string" option (or resolve it yourself: run
   `nslookup -type=SRV _mongodb._tcp.<your-cluster>.mongodb.net 8.8.8.8` and
   `nslookup -type=TXT <your-cluster>.mongodb.net 8.8.8.8` to get the shard
   hostnames + replica set name).
2. Build a `mongodb://` (not `+srv`) URI listing all shard hosts directly:
   ```
   MONGO_URI=mongodb://user:pass@shard-00-00.xxxxx.mongodb.net:27017,shard-00-01.xxxxx.mongodb.net:27017,shard-00-02.xxxxx.mongodb.net:27017/campaign_monitoring?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
   ```
   This uses regular DNS (`A` records) instead of `SRV`/`TXT`, which almost
   every network allows.

## Backend Setup

```bash
cd server
npm install
cp .env.example .env   # edit values, see below
npm run seed:rules      # loads the 5 default alert rules into MongoDB
npm run seed:admin      # creates the first admin account (from ADMIN_* env vars)
npm run dev             # starts the API + cron scheduler on http://localhost:5000
```

### Key environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `GOOGLE_ADS_MOCK_MODE` | `true` (default) generates realistic fake campaign data every minute so you can run the whole pipeline without real Google Ads credentials. Set to `false` and fill in the `GOOGLE_ADS_*` fields to pull live data. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Required to actually deliver alerts. Without them, alerts are logged as `FAILED` in `AlertHistory` but the rest of the pipeline still runs. |
| `CAMPAIGN_FETCH_CRON` | Defaults to every minute (`*/1 * * * *`) |
| `DEFAULT_ALERT_COOLDOWN_MINUTES` / `DEFAULT_SPEND_LIMIT` | Used when seeding default rules |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Used **once** by `npm run seed:admin` to create the first admin account in the database. Not read on every login - media buyer accounts are created afterwards from the dashboard's Media Buyers page. |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Signs the dashboard's login session token. Set `JWT_SECRET` to a long random string in production. |

### Getting a Telegram chat ID

1. Message your bot (anything) after creating it via BotFather.
2. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` and read `message.chat.id`.

## Frontend Setup

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

Log in with the account created by `npm run seed:admin` (defaults: `admin` /
`admin123`). The dashboard sidebar shows:

- **Overview** - KPI strip, a "Needs Attention" panel (Warning/Critical campaigns only), and the full campaign detail table
- **Alert History** - paginated list of every alert sent or attempted
- **Alert Rules** - edit thresholds, cooldowns, and enable/disable each rule directly from the UI
- **Media Buyers** *(admin only)* - create/edit accounts, assign a Telegram chat ID per person
- **My Profile** *(everyone)* - self-service: set your own Telegram chat ID

All dashboard API routes require a `Bearer` token obtained from
`POST /api/auth/login`; the frontend handles this automatically once you're
logged in. `/api/tracking/*` stays public since landing pages call it
directly, without a login session.

The dashboard polls `GET /api/campaigns` and `GET /api/alerts` every
`VITE_POLL_INTERVAL_MS` (default 15s, see `client/.env`) for near real-time
updates without a websocket layer.

## Multi-User: Admin + Media Buyers

Built for a team where multiple media buyers share one company account but
should only see and be alerted about their own campaigns:

| Role | Can see | Can do |
|---|---|---|
| **admin** | Every campaign, all media buyer accounts | Create/deactivate media buyer accounts, assign campaigns to a buyer, edit alert rules |
| **media_buyer** | Only campaigns assigned to them | Set their own Telegram chat ID, view their own alert history |

**How assignment works:** every campaign discovered by `googleAdsService`
(mock or real) is registered once in the `Campaign` collection (`campaignId`
→ `assignedTo`). An admin assigns it to a media buyer from the "All
Campaigns" table on the Overview page (a dropdown appears in the last
column, admin-only). `GET /api/campaigns` then filters results server-side
based on the logged-in user's role - a media buyer's token literally cannot
retrieve another buyer's campaigns, even by guessing IDs.

**How per-user Telegram alerts work:** each `User` document has its own
`telegramChatId`. When a campaign's alert fires, `ruleEngine.js` looks up
who that campaign is assigned to and sends the Telegram message to *their*
chat ID - not one shared group. Campaigns with no assignee (or a buyer who
hasn't set their chat ID yet) fall back to the shared `TELEGRAM_CHAT_ID` in
`.env`, so nothing silently gets dropped.

Creating a new media buyer (Media Buyers page, admin only): username,
password, full name, and optionally their Telegram chat ID up front - or
they can set it themselves later from My Profile.

## Workflow (runs every minute via node-cron)

```
Fetch Campaign Data (Google Ads API or mock)
        ↓
Store CampaignMetrics
        ↓
Evaluate active AlertRules (Rule Engine)
        ↓
Generate Recommendation (Recommendation Engine)
        ↓
Send Telegram Alert (skipped if still in cooldown)
        ↓
Store AlertHistory
```

## Default Alert Rules (seeded via `npm run seed:rules`)

| Type | Default Threshold | Meaning |
|---|---|---|
| `LANDING_CLICK_COUNT` | ≥ 4 in 60 min | Landing page visits per campaign |
| `GCLID_COUNT` | ≥ 4 in 60 min | Unique GCLIDs per campaign |
| `SPEND_LIMIT` | > $50 | Spend exceeds configured limit |
| `HIGH_CLICKS_LOW_GCLID` | clicks ≥ 40 AND gclids ≤ 8 | Possible traffic-quality issue |
| `HIGH_SPEND_ZERO_CONVERSIONS` | spend > $50 AND conversions = 0 | Wasted spend |

All rules are stored in MongoDB (`AlertRules` collection) and can be edited,
disabled, or created via the `/api/rules` REST endpoints — no code changes
or redeploys needed to retune thresholds.

## Recommendation Logic

| Condition | Recommendation |
|---|---|
| Spend > limit AND conversions = 0 | **Pause Campaign** |
| Clicks ≥ 40 AND GCLID/Click ratio ≤ 0.2 | **Decrease Traffic Frequency** |
| Clicks ≤ 20 AND GCLID/Click ratio ≥ 0.8 | **Increase Traffic Frequency** |
| Otherwise | **Monitor Campaign** |

## Landing Page / GCLID Tracking

Two pieces make this work: Google Ads needs to put campaign info + `gclid`
into the URL a visitor lands on, and the landing page needs a script that
reads that URL and reports the visit back to this API.

### 1. Get Google Ads to tag the URL

In the campaign (or account-level) **Tracking Template**, set:

```
{lpurl}?campaignid={campaignid}&campaignname={_campaignname}&gclid={gclid}
```

`{lpurl}` keeps your original destination URL intact; the rest are
[Google Ads ValueTrack parameters](https://support.google.com/google-ads/answer/6305348)
filled in automatically per click. Every visitor now arrives at your landing
page with a URL like:
```
https://yoursite.com/lp?campaignid=1000000001&campaignname=Weight+Loss+US&gclid=Cj0KCQiA...
```

### 2. Add the tracking script to your landing page

The server ships a ready-made snippet at `server/public/tracking.js`,
served statically at `<your-backend-url>/tracking.js`. Add one line before
`</body>` on every landing page:

```html
<script src="https://YOUR_BACKEND_DOMAIN/tracking.js"></script>
```

It reads `campaignid` / `campaignname` / `gclid` from the current page URL
(no config needed - it infers the API origin from its own `<script src>`)
and pings `GET /api/tracking/visit` in the background. Fails silently if
the params are missing, so it never breaks the page it's installed on.
Works on any platform that lets you paste a script tag (raw HTML, WordPress,
Google Tag Manager, Unbounce/Instapage/ClickFunnels custom code, etc).

### What gets recorded

- Every visit records a `LandingClicks` document (IP, user agent, timestamp, URL).
- If a `gclid` is present, it's inserted into `GclidLogs`, deduplicated via a
  unique index on `gclid` — duplicate hits from the same click are ignored,
  not double-counted.
- Counts show up immediately in the dashboard's "Landing Clicks" / "GCLID
  Count" columns and feed the `LANDING_CLICK_COUNT` / `GCLID_COUNT` /
  `HIGH_CLICKS_LOW_GCLID` rules on the next monitoring cycle.

You can call the endpoint directly too, for testing or non-JS integrations:
```
GET /api/tracking/visit?campaignId=123&campaignName=My+Campaign&gclid=abc123&landingPageUrl=https://example.com/lp
```

## Deploying to Render

A `render.yaml` blueprint at the repo root defines both services - the
Express API and the static React build.

1. Push this repo to GitHub (already done if you're reading this from there).
2. In the [Render dashboard](https://dashboard.render.com), click **New >
   Blueprint** and select this repo. Render reads `render.yaml` and creates
   two services: `campaign-monitoring-server` (Node web service) and
   `campaign-monitoring-client` (static site).
3. During setup, Render prompts for the env vars marked `sync: false` in
   `render.yaml`. Fill in at minimum:
   - `MONGO_URI` (your Atlas connection string)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (shared admin fallback bot)
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` (first admin login)
   - Leave `VITE_API_BASE_URL` (client service) blank for now - see step 5.
   `JWT_SECRET` is auto-generated by Render, no need to set it.
4. Deploy. The backend seeds its 5 default alert rules and the admin
   account automatically on first boot (`server.js` does this on every
   startup - safe, upsert-based).
5. Once the backend service is live, copy its URL (e.g.
   `https://campaign-monitoring-server.onrender.com`) and set the client
   service's `VITE_API_BASE_URL` env var to `<that-url>/api`, then trigger
   a redeploy of the client service so the build picks it up (Vite env
   vars are baked in at build time, not read at runtime).
6. Point your landing pages' tracking script (see above) and Google Ads
   tracking template at the backend's live URL instead of `localhost`.

Render's free tier spins down web services after inactivity - the first
request after idling takes ~30-60s to wake up, and the every-minute cron
job will not fire while asleep. Fine for testing; upgrade the plan (or
self-host) for real always-on monitoring.

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Log in, returns a JWT + `{ username, name, role }` |
| GET | `/api/auth/me` | Validate a stored token on app load |
| GET | `/api/campaigns` | Dashboard summary - filtered to the caller's assigned campaigns unless admin |
| GET | `/api/campaigns/:campaignId/history` | Time-series metrics for one campaign |
| PUT | `/api/campaigns/:campaignId/assign` | *(admin only)* Assign/unassign a campaign to a media buyer |
| GET | `/api/tracking/visit` | Record a landing page visit (+ gclid) - public, no auth |
| GET | `/api/alerts` | Paginated alert history |
| GET/POST/PUT/DELETE | `/api/rules` | Manage alert rules |
| GET/PUT | `/api/users/me` | Any logged-in user's own profile / Telegram chat ID |
| GET/POST/PUT/DELETE | `/api/users` | *(admin only)* Manage media buyer accounts |

## Notes on Production Readiness

- **Duplicate alert prevention**: enforced by `AlertHistory` cooldown lookups per campaign+rule (`alertService.isInCooldown`), not in-memory state — safe across restarts and multiple instances sharing one MongoDB.
- **GCLID dedup**: enforced at the database level via a unique index, not application logic — safe under concurrent requests.
- **Overlap guard**: the cron job skips a tick if the previous one is still running, so a slow Google Ads API call can't stack concurrent monitoring cycles.
- **Logging**: Winston writes to `server/logs/combined.log` and `server/logs/error.log`, plus console in development.
- **Mock mode**: lets you demo/test the entire pipeline (including Telegram alerts) without live Google Ads credentials.
