# OAISIS Analytics

One dashboard for every product's numbers, behind one password.

Opaque is wired up. OAISIS Labs and FAIKE have their places on the hub and are
waiting on credentials.

Surrender writes `users`, `events` and `sessions` into `surrender-e927a` from
the app itself, in the same shape FAIKE uses. It is the one product with no API
cost — the seven-day plan is generated on device — so its P&L is revenue minus
ad spend and nothing else. Ad spend is not something an app can know: write one
row per day per channel into a `spend` collection with an `amount_usd` field,
and CAC and ROAS light up. Until then they render as em-dashes rather than
guesses.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

Open http://localhost:3000 — you'll be asked for the password before anything
renders.

## Environment

| Variable | What it is |
|---|---|
| `DASHBOARD_PASSWORD` | The one password. Change it here, restart, done. |
| `AUTH_SECRET` | Signs the session cookie. `openssl rand -hex 32`. Rotating it signs everyone out. |
| `OPAQUE_SERVICE_ACCOUNT_B64` | Base64 of the `opaque-3964b` service account JSON. |
| `SURRENDER_SERVICE_ACCOUNT_B64` | Base64 of the `surrender-e927a` service account JSON. |

Locally you can skip the base64 and drop the key in as `serviceAccount.json`
instead — it's gitignored, and `lib/firebase.js` falls back to it. A deploy has
no files, so it uses the env var.

```bash
base64 -i serviceAccount.json | tr -d '\n' | pbcopy
```

## How the password works

There are no accounts. `POST /api/auth` checks the password in constant time
and sets an httpOnly cookie whose value is an HMAC of a fixed string under
`AUTH_SECRET`. `middleware.js` recomputes that HMAC on every request and
compares. Anyone with the password can mint the cookie; nobody can forge it
without the secret. Deep links survive the redirect — `/opaque/users` sends you
to login and back again.

Everything is gated: pages and API routes alike, all but `/login` and
`/api/auth`.

## Layout

```
app/
  login/            the password form, no shell around it
  (dash)/           everything behind the gate
    page.js         the product hub
    opaque/         Overview · Filters · Users · Sessions · Prompts
lib/
  auth.js           cookie signing, constant-time compare
  firebase.js       one admin app per product
  data.js           every Firestore read + derived metric
components/         Nav, Charts, Live
middleware.js       the gate
```

## Adding a product

1. Add its credentials to `PRODUCTS` in `lib/firebase.js` and set the env var.
2. Add a folder under `app/(dash)/` and read with `db("yourproduct")`.
3. Add it to `SECTIONS` in `components/Nav.js` and to `PRODUCTS` in
   `app/(dash)/page.js`, flipping `live` to `true`.

## What Opaque reports

| Page | What it answers |
|---|---|
| Overview | Users, generations, API cost vs revenue, P&L total and per user, DAU, daily cost, D1/D7/D30 retention, usage funnel (session → tap → apply → generate → save), paywall funnel, per-engine cost and speed |
| Filters | Most applied; eye-catchers (tapped a lot, rarely applied — the cover beats the result); keepers (highest save rate, worth promoting) |
| Users | Demographics, top filters per segment, and a per-user table: sessions, generations, saves, prompts, cost, revenue, P&L, first and last seen |
| Sessions | Session-level behaviour |
| Prompts | Every custom prompt users typed, verbatim — the feature requests nobody filed |

Source data is written by the iOS app (`Services/Metrics.swift`) into
`events/`, `users/`, `filterStats/`, `prompts/` and `pongScores/`. Pages are
server-rendered on every load, so a refresh is current.
