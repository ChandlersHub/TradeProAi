# Trade Pro AI demo

A demo of one AI back office for three Phoenix trade companies: LJ's Cleaning Solutions, All Faze Electric and Platinum Refrigeration. Built with Next.js. All data is sample data generated in the app; nothing connects to a real phone line, CRM or payment system yet.

## What's in it

| Screen | Demo moment |
|---|---|
| **Calls & texts** | Simulate an after-hours call for any brand. The AI answers in that company's name, triages, books or dispatches, and texts the tech and customer. |
| **Dispatch board** | Today's and upcoming jobs by tech. Jobs from the call and cross-sell simulations appear here. |
| **Field copilot** | A tech's voice note becomes a job report, an invoice, a review request and a maintenance-plan offer. |
| **Cross-sell** | An LJ's crew photo of a warm walk-in (or dead lot lights) opens a Platinum (or All Faze) ticket and texts the customer. |
| **Owner dashboard** | Calls caught, after-hours calls, jobs booked, revenue and response time per company. |

## Logins

| Username | Sees |
|---|---|
| `owner` | All three companies |
| `ljs` | LJ's Cleaning Solutions only, plus referrals to or from LJ's |
| `allfaze` | All Faze Electric only |
| `platinum` | Platinum Refrigeration only |

Passwords come from environment variables (see `.env.example`). Each login uses its own variable (`OWNER_PASSWORD`, `LJS_PASSWORD`, `ALLFAZE_PASSWORD`, `PLATINUM_PASSWORD`) and falls back to `DEMO_PASSWORD`. In production the site refuses all logins until `AUTH_SECRET` and the passwords are set. Locally, with no variables set, every login uses the password `demo`.

Anything created during a demo (simulated calls, jobs, referrals) is kept in that browser only. **Reset demo** in the sidebar clears it.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000 and sign in as owner / demo
```

## Deploy to Vercel with trade-pro.ai

1. In Vercel, **Add New → Project**, import this GitHub repo. The defaults for Next.js are correct.
2. Before the first deploy, open **Environment Variables** and add:
   - `AUTH_SECRET`: a long random string (`openssl rand -base64 32`)
   - `OWNER_PASSWORD`, `LJS_PASSWORD`, `ALLFAZE_PASSWORD`, `PLATINUM_PASSWORD` (or just `DEMO_PASSWORD`)
3. Deploy, then sign in on the `*.vercel.app` URL to check it.
4. **Settings → Domains → Add** `trade-pro.ai` (and `www.trade-pro.ai`). Vercel shows the DNS records to add at your registrar, usually an `A` record for `@` pointing to Vercel's IP and a `CNAME` for `www` pointing to `cname.vercel-dns.com`. HTTPS is issued automatically once DNS resolves.

The site sends `noindex` headers so search engines don't list the demo.
