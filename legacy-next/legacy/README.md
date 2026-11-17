# riphere.com — personal portfolio

A fast, dependency-free static portfolio for Ben Rippere. No build step, no framework —
just `index.html` + `styles.css`. Edit and ship.

```
riphere-site/
├── index.html     # the whole site (hero, work, about, building-in-public, connect)
├── styles.css     # all styling (dark theme, indigo/cyan accent)
└── README.md      # this file
```

## Preview locally

```bash
cd riphere-site
python3 -m http.server 8799
# open http://localhost:8799
```

## What still needs your input

- **LinkedIn + X links.** Two buttons in the Connect section render as `(soon)` and are
  disabled. Search `LINKEDIN_PLACEHOLDER` and `X_PLACEHOLDER` in `index.html`, replace the
  `href="#"` with your real URLs, and drop the `data-placeholder` / `aria-disabled` attrs.
  (Same two values fill the GitHub profile README — do both at once.)
- **Email.** The Connect section publishes `ben@riphere.com` (your branded address). Swap
  for a contact form if you'd rather not expose a mailbox directly.

---

## Deploy to riphere.com (Cloudflare Pages — recommended)

The domain is already on Cloudflare, so Pages is the zero-cost, zero-config path.

1. Push this folder to a GitHub repo (e.g. `rippere/riphere-site`).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the
   repo. Build command: *(none)*. Output dir: `/` (root). Framework preset: **None**.
3. After the first deploy succeeds at `*.pages.dev`, go to the Pages project →
   **Custom domains → Set up a domain** → add `riphere.com` and `www.riphere.com`.

> ⚠️ **Do step 3 only AFTER the CRM has vacated `riphere.com`** (see runbook below), or
> you'll be pointing the apex at two things at once.

Alternative hosts (all work with this static folder): GitHub Pages, Netlify, Vercel —
all "no build, output = root."

---

## CRM → subdomain migration runbook (frees riphere.com for the portfolio)

**Goal:** move NovaCRM off `riphere.com` to `app.riphere.com` (web) + `api.riphere.com`
(API), so the apex is free for this portfolio. Decided plan: subdomain now, dedicated
brand domain later.

> Steps marked **(you)** need dashboard/console access I don't have. Steps marked
> **(claude)** I can do or have prepped. Do them in this order — OAuth is the trap.

1. **(you) Railway — add custom domains.** On the **web** service add `app.riphere.com`;
   on the **API** service add `api.riphere.com`. Railway shows a CNAME target for each.
2. **(you) Cloudflare DNS.** Add two CNAME records (proxied = orange cloud):
   - `app`  → `<railway-web-target>`
   - `api`  → `<railway-api-target>`
3. **(you) Railway env vars** — update on all relevant services and redeploy:
   - `FRONTEND_URL = https://app.riphere.com`
   - `API_URL = https://api.riphere.com`  *(set on API, worker, beat)*
   - `NEXT_PUBLIC_FASTAPI_URL = https://api.riphere.com`  *(web)*
4. **(you) OAuth consoles — the part that silently breaks logins if skipped:**
   - **Google Cloud Console** → OAuth client → Authorized redirect URIs → add
     `https://api.riphere.com/auth/gmail/callback`.
   - **Slack app** → OAuth & Permissions → Redirect URLs → add
     `https://api.riphere.com/auth/slack/callback` and
     `https://api.riphere.com/slack/interactions`.
   - Leave the old `riphere.com` URIs in place until cutover is verified, then remove.
5. **(claude/you) Verify** — `curl -s https://api.riphere.com/health` should be green;
   load `https://app.riphere.com`, then run one real Gmail + one Slack OAuth round-trip.
   "It loads" isn't done; "I completed a login" is.
6. **(you) Free the apex.** In Cloudflare, repoint `riphere.com` + `www` away from the CRM
   and over to the Pages project (step 3 of the Pages deploy above).
7. **(later) Dedicated CRM brand domain.** When you pick a name, repeat steps 1–4 with the
   new domain and 301 `app.riphere.com` → it.

**Rollback:** revert the Cloudflare records + Railway env vars to their previous values and
redeploy; OAuth URIs are additive so leaving them costs nothing.
