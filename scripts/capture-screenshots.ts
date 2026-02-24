/**
 * Demo screenshot capture script.
 *
 * Creates a temporary SQLite DB with English dummy data,
 * starts a temporary Vite dev server pointing at that DB,
 * captures 4 screenshots with Playwright, then cleans up.
 *
 * Usage:  npx tsx scripts/capture-screenshots.ts
 */

import { chromium } from "@playwright/test";
import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";

// Resolve better-sqlite3 from kanban-board's node_modules
const Database = require(
  require.resolve("better-sqlite3", {
    paths: [path.resolve(__dirname, "../kanban-board")],
  })
);

// ── Paths ────────────────────────────────────────────────────────────────────
const DEMO_DBS_DIR = "/tmp/kanban-demo-dbs";
const DEMO_IMAGES_DIR = "/tmp/kanban-demo-images";
const KANBAN_DIR = path.resolve(__dirname, "../kanban-board");
const OUT_DIR = path.resolve(__dirname, "../docs/screenshots");
const PORT = 5179;
const BASE_URL = `http://localhost:${PORT}`;
const VIEWPORT = { width: 1280, height: 800 };
const PROJECT = "my-app";

// ── Step 1: Seed demo DB ────────────────────────────────────────────────────

function seedDemoDb(): void {
  // Clean previous run
  if (fs.existsSync(DEMO_DBS_DIR)) fs.rmSync(DEMO_DBS_DIR, { recursive: true });
  fs.mkdirSync(DEMO_DBS_DIR, { recursive: true });
  fs.mkdirSync(DEMO_IMAGES_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const db = new Database(path.join(DEMO_DBS_DIR, `${PROJECT}.db`));
  db.pragma("journal_mode = DELETE");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      description TEXT,
      plan TEXT,
      implementation_notes TEXT,
      tags TEXT,
      review_comments TEXT,
      plan_review_comments TEXT,
      test_results TEXT,
      agent_log TEXT,
      current_agent TEXT,
      plan_review_count INTEGER NOT NULL DEFAULT 0,
      impl_review_count INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 3,
      attachments TEXT,
      notes TEXT,
      rank INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      started_at TEXT,
      planned_at TEXT,
      reviewed_at TEXT,
      tested_at TEXT,
      completed_at TEXT
    );
  `);

  const insert = db.prepare(`
    INSERT INTO tasks (
      project, title, status, priority, level, rank,
      description, plan, implementation_notes, tags,
      review_comments, plan_review_comments, test_results,
      agent_log, current_agent, notes,
      plan_review_count, impl_review_count,
      created_at, started_at, planned_at, reviewed_at, tested_at, completed_at
    ) VALUES (
      @project, @title, @status, @priority, @level, @rank,
      @description, @plan, @implementation_notes, @tags,
      @review_comments, @plan_review_comments, @test_results,
      @agent_log, @current_agent, @notes,
      @plan_review_count, @impl_review_count,
      @created_at, @started_at, @planned_at, @reviewed_at, @tested_at, @completed_at
    )
  `);

  const cards = buildDemoCards();
  const tx = db.transaction(() => {
    for (const card of cards) insert.run(card);
  });
  tx();

  db.close();
  console.log(`Seeded ${cards.length} cards into ${DEMO_DBS_DIR}/${PROJECT}.db`);
}

function buildDemoCards() {
  const p = PROJECT;
  const j = JSON.stringify;

  // ── todo (5 cards) ──────────────────────────────────────────────────────
  const todoCards = [
    {
      project: p, title: "Set up CI/CD pipeline with GitHub Actions",
      status: "todo", priority: "high", level: 3, rank: 1000,
      description: "Configure automated build, test, and deploy pipeline.\n\n- Build on push to main\n- Run full test suite\n- Deploy to staging on merge\n- Notify Slack on failure",
      tags: j(["devops", "ci"]),
      created_at: "2026-02-20 09:00:00",
    },
    {
      project: p, title: "Add user profile avatar upload",
      status: "todo", priority: "medium", level: 2, rank: 2000,
      description: "Allow users to upload and crop a profile image.\n\n- Accept PNG/JPG up to 5 MB\n- Generate 128x128 thumbnail\n- Store in S3-compatible bucket",
      tags: j(["feature", "ui"]),
      created_at: "2026-02-20 10:00:00",
    },
    {
      project: p, title: "Implement rate limiting for API endpoints",
      status: "todo", priority: "high", level: 3, rank: 3000,
      description: "Add sliding-window rate limiting to prevent abuse.\n\n- 100 req/min per IP for public endpoints\n- 1000 req/min for authenticated users\n- Return 429 with Retry-After header",
      tags: j(["api", "security"]),
      created_at: "2026-02-21 08:00:00",
    },
    {
      project: p, title: "Add keyboard shortcuts for navigation",
      status: "todo", priority: "low", level: 1, rank: 4000,
      description: "Implement common keyboard shortcuts (e.g. `?` for help, `/` for search).",
      tags: j(["ux"]),
      created_at: "2026-02-22 11:00:00",
    },
    {
      project: p, title: "Create API documentation with OpenAPI",
      status: "todo", priority: "medium", level: 2, rank: 5000,
      description: "Generate interactive API docs from OpenAPI 3.0 spec.\n\n- Auto-generate from route decorators\n- Serve at /docs endpoint\n- Include authentication examples",
      tags: j(["docs", "api"]),
      created_at: "2026-02-22 14:00:00",
    },
  ];

  // ── plan (2 cards) ──────────────────────────────────────────────────────
  const planCards = [
    {
      project: p, title: "Implement dark mode toggle",
      status: "plan", priority: "medium", level: 3, rank: 1000,
      description: "Add system-aware dark/light theme toggle with persistence.",
      plan: "> **Planner** `opus` · 2026-02-23T10:00:00Z\n\n## Approach\n\n1. Add CSS custom properties for all color tokens\n2. Create `ThemeProvider` context with `useMediaQuery` hook\n3. Persist preference to `localStorage`\n4. Add toggle button in header\n\n## Files to Modify\n\n- `src/styles/tokens.css` — define light/dark variables\n- `src/components/ThemeToggle.tsx` — new component\n- `src/providers/ThemeProvider.tsx` — context + hook\n- `src/App.tsx` — wrap with provider",
      tags: j(["feature", "ui"]),
      current_agent: "Planner",
      agent_log: j([
        { agent: "Planner", model: "opus", message: "Drafting plan — CSS custom properties approach selected over CSS-in-JS for better performance.", timestamp: "2026-02-23T10:00:00.000Z" },
      ]),
      created_at: "2026-02-19 14:00:00",
      started_at: "2026-02-23 10:00:00",
    },
    {
      project: p, title: "Add WebSocket real-time notifications",
      status: "plan", priority: "high", level: 2, rank: 2000,
      description: "Push real-time updates to connected clients when tasks change.",
      plan: "> **Planner** `opus` · 2026-02-24T08:00:00Z\n\n## Design\n\n- Use `ws` library on the server\n- Broadcast task update events on PATCH/POST\n- Client reconnects with exponential backoff",
      tags: j(["feature", "api"]),
      current_agent: "Planner",
      agent_log: j([
        { agent: "Planner", model: "opus", message: "Planning WebSocket integration — evaluating ws vs Socket.IO.", timestamp: "2026-02-24T08:00:00.000Z" },
      ]),
      created_at: "2026-02-18 09:00:00",
      started_at: "2026-02-24 08:00:00",
    },
  ];

  // ── plan_review (1 card) ────────────────────────────────────────────────
  const planReviewCards = [
    {
      project: p, title: "Refactor user service to repository pattern",
      status: "plan_review", priority: "medium", level: 3, rank: 1000,
      description: "Extract data access logic from UserService into a dedicated repository layer.",
      plan: "> **Planner** `opus` · 2026-02-22T14:00:00Z\n\n## Refactoring Plan\n\n1. Create `UserRepository` interface\n2. Implement `PrismaUserRepository`\n3. Inject repository into `UserService` via constructor\n4. Update all call sites\n5. Add unit tests with mock repository\n\n## Files\n\n- `src/repositories/UserRepository.ts` — interface\n- `src/repositories/PrismaUserRepository.ts` — implementation\n- `src/services/UserService.ts` — refactor to use repository\n- `src/tests/UserService.test.ts` — new tests",
      plan_review_comments: j([
        {
          reviewer: "Critic", model: "sonnet", status: "changes_requested",
          comment: "> **Critic** `sonnet` · 2026-02-22T16:00:00Z\n\n## Review\n\nGood overall structure. Two concerns:\n\n1. **Transaction handling** — Plan doesn't address how transactions span repository + service. Add `UnitOfWork` or pass transaction context.\n2. **Migration strategy** — Need a step-by-step migration plan to avoid breaking changes during refactor.",
          timestamp: "2026-02-22T16:00:00.000Z",
        },
      ]),
      plan_review_count: 1,
      tags: j(["refactor", "architecture"]),
      agent_log: j([
        { agent: "Planner", model: "opus", message: "Plan complete. 4 files to modify, 1 new interface.", timestamp: "2026-02-22T14:00:00.000Z" },
        { agent: "Critic", model: "sonnet", message: "Requesting changes — transaction handling and migration strategy need work.", timestamp: "2026-02-22T16:00:00.000Z" },
      ]),
      created_at: "2026-02-17 10:00:00",
      started_at: "2026-02-22 14:00:00",
      planned_at: "2026-02-22 15:30:00",
    },
  ];

  // ── impl (2 cards) ──────────────────────────────────────────────────────
  const implCards = [
    {
      // Card #9 — rich data for card-detail screenshot
      project: p, title: "Add JWT authentication middleware",
      status: "impl", priority: "high", level: 3, rank: 1000,
      description: "Implement JWT-based auth middleware for protected API routes.\n\n## Requirements\n\n- Verify RS256 tokens from Auth0\n- Extract user claims and attach to request context\n- Return 401 for expired/invalid tokens\n- Support refresh token rotation\n- Add rate limiting per user ID",
      plan: "> **Planner** `opus` · 2026-02-21T09:00:00Z\n\n## Implementation Plan\n\n### 1. Token Verification\n\n- Use `jose` library for JWT verification\n- Fetch JWKS from Auth0 `.well-known/jwks.json`\n- Cache public keys with 1h TTL\n\n### 2. Middleware Chain\n\n```typescript\nexport function authMiddleware(req, res, next) {\n  const token = extractBearerToken(req);\n  const claims = await verifyToken(token);\n  req.user = claims;\n  next();\n}\n```\n\n### 3. Files to Create/Modify\n\n| File | Action |\n|------|--------|\n| `src/middleware/auth.ts` | New — main middleware |\n| `src/lib/jwt.ts` | New — token verification |\n| `src/types/request.d.ts` | Modify — extend Request type |\n| `src/routes/api.ts` | Modify — apply middleware |\n| `src/tests/auth.test.ts` | New — unit tests |",
      implementation_notes: "> **Builder** `opus` · 2026-02-22T10:00:00Z\n\n## Progress\n\n- Created `src/middleware/auth.ts` with Bearer token extraction\n- Implemented JWKS fetching and caching in `src/lib/jwt.ts`\n- Extended Request type with `user` property\n\n## Pending\n\n- Refresh token rotation logic\n- Integration with rate limiter\n- Error response formatting",
      tags: j(["auth", "api", "security"]),
      current_agent: "Builder",
      plan_review_comments: j([
        {
          reviewer: "Critic", model: "sonnet", status: "approved",
          comment: "> **Critic** `sonnet` · 2026-02-21T11:00:00Z\n\nPlan is solid. Good use of `jose` over `jsonwebtoken` for edge runtime compatibility. JWKS caching approach is appropriate. Approved.",
          timestamp: "2026-02-21T11:00:00.000Z",
        },
      ]),
      plan_review_count: 1,
      agent_log: j([
        { agent: "Planner", model: "opus", message: "Plan complete. 3 new files, 2 modifications.", timestamp: "2026-02-21T09:00:00.000Z" },
        { agent: "Critic", model: "sonnet", message: "Plan approved. No major issues.", timestamp: "2026-02-21T11:00:00.000Z" },
        { agent: "Builder", model: "opus", message: "Implementation in progress — auth middleware and JWT verification done, working on refresh token rotation.", timestamp: "2026-02-22T10:00:00.000Z" },
      ]),
      notes: j([
        { id: 1708857600000, text: "Consider using Auth0 Actions for custom claims instead of manual enrichment.", author: "user", timestamp: "2026-02-21T12:00:00.000Z" },
      ]),
      created_at: "2026-02-15 08:00:00",
      started_at: "2026-02-21 09:00:00",
      planned_at: "2026-02-21 10:30:00",
    },
    {
      project: p, title: "Fix N+1 query in dashboard API",
      status: "impl", priority: "medium", level: 2, rank: 2000,
      description: "Dashboard endpoint fires separate SQL query per project. Use JOIN or subquery to batch.",
      implementation_notes: "> **Builder** `opus` · 2026-02-24T09:00:00Z\n\nReplaced loop with single query using LEFT JOIN. Response time dropped from 450ms to 35ms.",
      tags: j(["performance", "api"]),
      current_agent: "Builder",
      agent_log: j([
        { agent: "Planner", model: "opus", message: "Plan: replace sequential queries with JOIN.", timestamp: "2026-02-24T08:00:00.000Z" },
        { agent: "Builder", model: "opus", message: "Implementing batched query approach.", timestamp: "2026-02-24T09:00:00.000Z" },
      ]),
      created_at: "2026-02-19 16:00:00",
      started_at: "2026-02-24 08:00:00",
    },
  ];

  // ── impl_review (1 card) ────────────────────────────────────────────────
  const implReviewCards = [
    {
      project: p, title: "Add pagination to search results",
      status: "impl_review", priority: "medium", level: 3, rank: 1000,
      description: "Implement cursor-based pagination for the /api/search endpoint.",
      plan: "> **Planner** `opus` · 2026-02-20T10:00:00Z\n\nUse cursor-based pagination with `after` parameter. Return `pageInfo { hasNextPage, endCursor }` in response.",
      implementation_notes: "> **Builder** `opus` · 2026-02-22T14:00:00Z\n\nImplemented cursor pagination using task ID as cursor. Added `limit` param (default 20, max 100). Response includes `pageInfo` object.",
      review_comments: j([
        {
          reviewer: "Inspector", model: "sonnet", status: "changes_requested",
          comment: "> **Inspector** `sonnet` · 2026-02-23T09:00:00Z\n\n## Code Review\n\n1. **Missing cursor validation** — `after` param is not validated. Malformed cursors cause 500 error.\n2. **Default limit** — Should document the default limit in the API response.\n\nOtherwise implementation looks good. Fix these two items and resubmit.",
          timestamp: "2026-02-23T09:00:00.000Z",
        },
      ]),
      impl_review_count: 1,
      tags: j(["feature", "api"]),
      agent_log: j([
        { agent: "Planner", model: "opus", message: "Plan complete.", timestamp: "2026-02-20T10:00:00.000Z" },
        { agent: "Builder", model: "opus", message: "Implementation complete — cursor-based pagination.", timestamp: "2026-02-22T14:00:00.000Z" },
        { agent: "Inspector", model: "sonnet", message: "Changes requested — cursor validation and docs.", timestamp: "2026-02-23T09:00:00.000Z" },
      ]),
      created_at: "2026-02-16 11:00:00",
      started_at: "2026-02-20 10:00:00",
      planned_at: "2026-02-20 11:00:00",
      reviewed_at: "2026-02-23 09:00:00",
    },
  ];

  // ── test (1 card) ───────────────────────────────────────────────────────
  const testCards = [
    {
      project: p, title: "Implement email verification flow",
      status: "test", priority: "high", level: 3, rank: 1000,
      description: "Send verification email on registration, confirm via signed token link.",
      plan: "> **Planner** `opus` · 2026-02-19T10:00:00Z\n\nUse signed JWT tokens with 24h expiry. Send via SendGrid transactional email.",
      implementation_notes: "> **Builder** `opus` · 2026-02-21T16:00:00Z\n\nComplete. Token generation, email sending, and verification endpoint all implemented. Added resend functionality.",
      test_results: j([
        {
          tester: "Ranger", model: "sonnet", status: "pass",
          lint: "0 errors, 0 warnings",
          build: "Build successful (2.3s)",
          tests: "18 passed, 0 failed",
          comment: "> **Ranger** `sonnet` · 2026-02-23T14:00:00Z\n\nAll checks passed. Token expiry and resend logic verified.",
          timestamp: "2026-02-23T14:00:00.000Z",
        },
      ]),
      tags: j(["auth", "feature"]),
      current_agent: "Ranger",
      agent_log: j([
        { agent: "Planner", model: "opus", message: "Plan complete.", timestamp: "2026-02-19T10:00:00.000Z" },
        { agent: "Critic", model: "sonnet", message: "Plan approved.", timestamp: "2026-02-19T11:00:00.000Z" },
        { agent: "Builder", model: "opus", message: "Implementation complete.", timestamp: "2026-02-21T16:00:00.000Z" },
        { agent: "Inspector", model: "sonnet", message: "Code approved.", timestamp: "2026-02-22T10:00:00.000Z" },
        { agent: "Ranger", model: "sonnet", message: "All tests passed — 18/18.", timestamp: "2026-02-23T14:00:00.000Z" },
      ]),
      created_at: "2026-02-14 09:00:00",
      started_at: "2026-02-19 10:00:00",
      planned_at: "2026-02-19 10:30:00",
      reviewed_at: "2026-02-22 10:00:00",
      tested_at: "2026-02-23 14:00:00",
    },
  ];

  // ── done (6 cards) ──────────────────────────────────────────────────────
  const doneCards = [
    {
      project: p, title: "Set up project scaffolding with Vite",
      status: "done", priority: "high", level: 1, rank: 1000,
      description: "Initialize Vite + TypeScript project with ESLint and testing setup.",
      tags: j(["setup"]),
      created_at: "2026-02-08 09:00:00", started_at: "2026-02-08 09:30:00",
      completed_at: "2026-02-10 14:00:00",
    },
    {
      project: p, title: "Design database schema for user model",
      status: "done", priority: "medium", level: 2, rank: 2000,
      description: "Define Prisma schema for users, sessions, and roles.",
      tags: j(["database", "design"]),
      created_at: "2026-02-09 10:00:00", started_at: "2026-02-11 09:00:00",
      completed_at: "2026-02-13 11:00:00",
    },
    {
      project: p, title: "Implement user registration endpoint",
      status: "done", priority: "high", level: 3, rank: 3000,
      description: "POST /api/auth/register with email + password.",
      tags: j(["auth", "api"]),
      created_at: "2026-02-10 08:00:00", started_at: "2026-02-13 09:00:00",
      completed_at: "2026-02-15 16:00:00",
    },
    {
      project: p, title: "Add input validation with Zod",
      status: "done", priority: "medium", level: 2, rank: 4000,
      description: "Add Zod schemas for all request bodies and query params.",
      tags: j(["validation", "api"]),
      created_at: "2026-02-12 11:00:00", started_at: "2026-02-16 10:00:00",
      completed_at: "2026-02-18 15:00:00",
    },
    {
      project: p, title: "Configure ESLint and Prettier",
      status: "done", priority: "low", level: 1, rank: 5000,
      description: "Set up linting and formatting with shared config.",
      tags: j(["tooling"]),
      created_at: "2026-02-11 14:00:00", started_at: "2026-02-18 09:00:00",
      completed_at: "2026-02-20 10:00:00",
    },
    {
      project: p, title: "Build responsive navigation component",
      status: "done", priority: "medium", level: 3, rank: 6000,
      description: "Create header nav with mobile hamburger menu and breadcrumbs.",
      tags: j(["ui", "feature"]),
      created_at: "2026-02-13 09:00:00", started_at: "2026-02-20 09:00:00",
      completed_at: "2026-02-22 17:00:00",
    },
  ];

  // Merge all cards — fill missing optional fields with defaults
  const allCards = [
    ...todoCards, ...planCards, ...planReviewCards,
    ...implCards, ...implReviewCards, ...testCards, ...doneCards,
  ];

  return allCards.map((c: Record<string, unknown>) => ({
    project:               c.project ?? p,
    title:                 c.title ?? "Untitled",
    status:                c.status ?? "todo",
    priority:              c.priority ?? "medium",
    level:                 c.level ?? 3,
    rank:                  c.rank ?? 1000,
    description:           c.description ?? null,
    plan:                  c.plan ?? null,
    implementation_notes:  c.implementation_notes ?? null,
    tags:                  c.tags ?? null,
    review_comments:       c.review_comments ?? null,
    plan_review_comments:  c.plan_review_comments ?? null,
    test_results:          c.test_results ?? null,
    agent_log:             c.agent_log ?? null,
    current_agent:         c.current_agent ?? null,
    notes:                 c.notes ?? null,
    plan_review_count:     c.plan_review_count ?? 0,
    impl_review_count:     c.impl_review_count ?? 0,
    created_at:            c.created_at ?? "2026-02-20 09:00:00",
    started_at:            c.started_at ?? null,
    planned_at:            c.planned_at ?? null,
    reviewed_at:           c.reviewed_at ?? null,
    tested_at:             c.tested_at ?? null,
    completed_at:          c.completed_at ?? null,
  }));
}

// ── Step 2: Start temporary Vite server ─────────────────────────────────────

function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    // Invoke vite binary directly (no npx wrapper) so kill() targets the right PID
    const viteBin = path.join(KANBAN_DIR, "node_modules", ".bin", "vite");
    const proc = spawn(
      viteBin,
      ["--port", String(PORT), "--strictPort"],
      {
        cwd: KANBAN_DIR,
        env: {
          ...process.env,
          KANBAN_DBS_DIR: DEMO_DBS_DIR,
          KANBAN_IMAGES: DEMO_IMAGES_DIR,
          BROWSER: "none",           // prevent auto-open
          FORCE_COLOR: "0",          // cleaner stdout parsing
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error("Vite server failed to start within 30s"));
      }
    }, 30_000);

    proc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stdout.write(text);
      if (!started && (text.includes("localhost") || text.includes("Local:"))) {
        started = true;
        clearTimeout(timeout);
        // Give it a moment to fully initialize
        setTimeout(() => resolve(proc), 1000);
      }
    });

    proc.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(data);
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on("exit", (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`Vite exited with code ${code} before starting`));
      }
    });
  });
}

// ── Step 3: Capture screenshots ─────────────────────────────────────────────

async function captureScreenshots(): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "dark",
  });
  const page = await context.newPage();

  // 1. Board View — full 7-column board
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".column", { timeout: 15_000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT_DIR, "board-view.png"),
    fullPage: false,
  });
  console.log("  board-view.png");

  // 2. Card Detail — click the JWT auth card (in impl column) for rich modal
  const jwtCard = page.locator('.card:has-text("JWT authentication")');
  await jwtCard.click();
  await page.waitForSelector("#modal-content h1", { timeout: 5_000 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT_DIR, "card-detail.png"),
    fullPage: false,
  });
  console.log("  card-detail.png");

  // Close modal
  await page.click("#modal-close");
  await page.waitForTimeout(300);

  // 3. List View — switch to List tab
  await page.click("#tab-list");
  await page.waitForSelector(".list-table", { timeout: 5_000 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT_DIR, "list-view.png"),
    fullPage: false,
  });
  console.log("  list-view.png");

  // 4. Search Filter — back to board, search "auth"
  await page.click("#tab-board");
  await page.waitForSelector(".column", { timeout: 5_000 });
  await page.waitForTimeout(300);
  await page.fill("#search-input", "auth");
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT_DIR, "search-filter.png"),
    fullPage: false,
  });
  console.log("  search-filter.png");

  await browser.close();
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Step 1: Seeding demo database...");
  seedDemoDb();

  console.log("Step 2: Starting temporary Vite server...");
  const server = await startServer();

  try {
    console.log("Step 3: Capturing screenshots...");
    await captureScreenshots();
    console.log(`\nAll screenshots saved to ${OUT_DIR}`);
  } finally {
    console.log("Step 4: Cleaning up...");
    server.kill("SIGTERM");

    // Wait for process to exit, force kill if needed
    await new Promise<void>((resolve) => {
      const forceKill = setTimeout(() => {
        try { server.kill("SIGKILL"); } catch { /* ok */ }
        resolve();
      }, 5000);
      server.on("exit", () => { clearTimeout(forceKill); resolve(); });
    });

    // Clean temp directories
    try { fs.rmSync(DEMO_DBS_DIR, { recursive: true }); } catch { /* ok */ }
    try { fs.rmSync(DEMO_IMAGES_DIR, { recursive: true }); } catch { /* ok */ }
    console.log("Done.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
