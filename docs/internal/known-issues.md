# Known Issues — adsb-tvos

Concrete defects and gaps found while writing this repository's documentation in
August 2026. **Nothing here was changed** — each one needs a code, configuration, or
licensing decision rather than a documentation one.

Ordered by severity. See [`docs/roadmap.md`](../roadmap.md) for the narrative version,
which also covers deliberate non-goals.

**4 open:** 1 medium, 3 low.

## 1. Two .env files are tracked and .gitignore has no rule for them

**Severity:** Medium

**Where:** `apps/proxy/.env`, `apps/web/.env`, `.gitignore`

**What:** Both files are committed. `.gitignore` covers `node_modules`, `dist`, `coverage`, `*.log` and several build directories, but nothing matching `.env`. There is no `.env.example`.

**Why it matters:** The current contents are harmless — a LAN address, a port, a poll interval. The pattern is the problem: the conventional place for a secret is now a tracked file with no ignore rule, so the first credential anyone adds is committed silently. `apps/proxy/.env` also publishes a private network address.

**Suggested fix:** Add `.env` and `.env.*` to `.gitignore` with an exception for `.env.example`, `git rm --cached` the two tracked files, and commit an `.env.example` carrying the keys with placeholder values.

## 2. The README pointed at .env.local while the repository tracks .env

**Severity:** Low

**Where:** `README.md` (previous version), `apps/web/.env`

**What:** Configuration instructions named `apps/web/.env.local`; the committed file is `apps/web/.env`. Vite reads both, with `.env.local` taking precedence.

**Why it matters:** Someone following the documentation creates a second file that silently overrides the tracked one, which makes a configuration problem hard to reason about.

**Suggested fix:** Pick one. `.env.example` committed plus `.env.local` ignored is the conventional split, and matches what the documentation already told people to do.

## 3. A wrong PIAWARE_BASE_URL fails silently

**Severity:** Low

**Where:** `apps/proxy/src/index.ts`

**What:** The proxy accepts any value and appends data paths to it. Supplying the SkyAware UI path or the Beast port produces a proxy that starts normally and returns nothing useful.

**Why it matters:** This is the documented most-common setup mistake, and the failure is indistinguishable from a receiver hearing no aircraft. Both `apps/proxy/README.md` and the repository README warn about it in prose, which is a sign it warrants a check rather than a warning.

**Suggested fix:** Fetch once at startup and log what came back — aircraft count, or the status and body of the failure. It turns the most common error into an immediate message.

## 4. Lint, test, and typecheck scripts exist but nothing runs them

**Severity:** Low

**Where:** `.github/workflows/` — none present

**What:** The root package defines `lint`, `test`, and `typecheck` across workspaces. There is no CI workflow.

**Why it matters:** `packages/shared` was deliberately built so its tests run anywhere with no browser, simulator, or feeder — the one part of this repository that is trivially CI-able is the part not being run.

**Suggested fix:** Add a workflow running `npm run typecheck && npm run lint && npm run test` on push and pull request.

---

## Also, across every repository

**`.bandit` is present on disk but untracked in git.** Verified in PyWorkout, treklogger,
skyscanner-cli, booking-cli, piggy, and aibot — the config file exists locally in each but
`git ls-files` does not know about it, so none of it reached GitHub.

The August 2026 security sweep therefore looks complete locally and landed nowhere. Worth
checking across all 44 repositories it covered.
