<div align="center">

# ⚡ NextFlow

### AI Workflow Builder — Visual Programming for the Gemini Era

**Drag. Connect. Run. Build AI pipelines without writing a single line of code.**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://prisma.io)
[![Gemini](https://img.shields.io/badge/Google-Gemini%201.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

[**Live Demo**](#) · [**Report Bug**](issues) · [**Request Feature**](issues)

</div>

---

## 🧠 What is NextFlow?

NextFlow is a **full-stack visual AI workflow builder** that lets you chain Google Gemini models, process data, and expose your logic as REST APIs — all through a beautiful drag-and-drop canvas. No code required.

Think of it as your personal **low-code AI orchestration engine** — inspired by the Magica.com interface, built on the best modern web stack.

> "Connect an input node → a Gemini AI node → a response node. Hit Run. That's it."

---

## ✨ Features

### 🖥️ Interface & UX
- **Pixel-perfect Magica.com design clone** — off-white sidebar (`#f8f8f7`) + pure white main content, exact color split
- **Google Sans Flex** variable font throughout for premium typography
- **Animated loading screen** — orbital ring animation with rotating motivational quotes
- **Collapsible sidebar** — 240px expanded with labels / 42px icon-only collapsed
- `"Close sidebar ←"` custom pill tooltip on hover (not browser default)
- Collapsible bottom panel — **Settings** outline pill + **Claim Offer** purple gradient pill
- User avatar + name row, centered at sidebar bottom

### 🎨 Visual Workflow Canvas
- **React Flow** canvas with dot-grid background, smooth pan/zoom
- **Animated edges** connecting nodes with directional arrows
- **MiniMap** in bottom-right corner (dark theme, workflow overview)
- **Pulsating glow effect** on nodes actively executing
- **Status badges** — `running` · `success` · `failed` · `partial`
- Right-click **context menu** on nodes (delete, duplicate)
- Fit-view, zoom-in, zoom-out canvas controls

### 🗂️ 3-Tab Workflow Editor

| Tab | What it does |
|---|---|
| **Workflow** | The React Flow canvas — drag, connect, configure nodes |
| **Playground** | Live input form + real-time output. Run your workflow like an app |
| **API** | Auto-generated Python snippet + endpoint docs. Call via REST |

### 🧩 Node Types

| Node | Icon | Description |
|---|---|---|
| **Request Inputs** | 📝 | Collects user-defined text inputs to feed into the pipeline |
| **Gemini AI** | ✦ | Runs Gemini 1.5 Pro or Flash — system prompt, user message, optional image vision |
| **Crop Image** | ✂️ | Crops an image by percentage coordinates via FFmpeg execution on Trigger.dev |
| **Response** | 💬 | Displays the final workflow output in a formatted card |

### ⚙️ Execution Engine
- **Trigger.dev v3** background task execution — all AI calls run server-side
- **DAG validation** — circular dependency detection before run
- **Topological sort** — nodes execute in correct dependency order
- **Real-time polling** — live status updates as nodes complete
- **Per-node results** stored in `WorkflowRun` — view exactly what each node returned
- **Execution history panel** (right sidebar) — every run with timestamp + duration

### 🔐 Auth & Data
- **Clerk** — Google OAuth + email/password sign-in
- **PostgreSQL + Prisma** — full workflow and run history persistence
- **User-scoped data** — each user only sees their own workflows
- **Import / Export** — workflows as portable JSON files

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR, API routes, middleware |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Database** | PostgreSQL + Prisma 5 | Reliable relational ORM |
| **Auth** | Clerk | Drop-in auth with OAuth |
| **Canvas** | React Flow 11 | Visual node-graph engine |
| **AI** | Google Gemini (`@google/generative-ai`) | Gemini 1.5 Pro & Flash, vision |
| **Background Tasks** | Trigger.dev v3 | Serverless AI task execution |
| **Image Processing** | FFmpeg | Precise image cropping filter on Trigger.dev background worker |
| **State** | Zustand 5 | Lightweight client state |
| **Animation** | Framer Motion 11 | Loading screen & transitions |
| **UI Primitives** | Radix UI | Dialog, Tooltip, Dropdown |
| **Styling** | Tailwind CSS + Inline Styles | Utility + pixel-precise control |
| **Validation** | Zod | API schema enforcement |
| **Icons** | Lucide React | Consistent icon system |
| **Cache** | Upstash Redis (optional) | Real-time job status |

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** database — [Neon](https://neon.tech) (free tier) recommended
- API keys from Clerk, Google AI Studio, and Trigger.dev
- **FFmpeg** installed on your system (for local testing; configured automatically on Trigger.dev cloud via build extension)

---

### Step 1 — Clone & Install

```bash
git clone https://github.com/your-username/nextflow.git
cd nextflow
npm install
```

---

### Step 2 — Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

```env
# ── Database ───────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host:5432/nextflow"

# ── Clerk Authentication ───────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ── Google Gemini ──────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key

# ── Trigger.dev ────────────────────────────────────────────
TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxx
```

---

### Step 3 — Database Setup

```bash
npx prisma generate
npx prisma db push
```

---

### Step 4 — Start Development

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — Trigger.dev background worker
npm run trigger:dev
```

Open **http://localhost:3000** → sign in → start building.

---

## 📚 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/workflows` | `GET` | List all workflows for current user |
| `/api/workflows` | `POST` | Create a new workflow |
| `/api/workflows/[id]` | `GET` | Fetch a single workflow with nodes/edges |
| `/api/workflows/[id]` | `PUT` | Update workflow (name, nodes, edges) |
| `/api/workflows/[id]` | `DELETE` | Delete workflow and all its run history |
| `/api/execute` | `POST` | Trigger a workflow execution run |
| `/api/execute` | `GET` | Poll execution status by run ID |
| `/api/seed-sample` | `POST` | Seed the "AI Racing Car Generator" sample |
| `/api/webhooks` | `POST` | Trigger.dev task completion callback |

All routes are protected by Clerk middleware. All request/response bodies are validated with Zod.

---

## 🎮 Usage Guide

### Create Your First Workflow

```
1. Dashboard → click "+" button (top right)
2. Blank canvas opens
3. Drag "Request Inputs" node from left sidebar
4. Drag "Gemini AI" node → connect Request Inputs → Gemini
5. Drag "Response" node → connect Gemini → Response
6. Click "Save" → then "Run"
7. Watch pulsating glow as Gemini executes
8. Results appear in the History panel (right side)
```

### Use the Playground Tab

```
1. Open any workflow → click "Playground" tab
2. Fill in the auto-generated input form (left column)
3. Click Run → output appears live (right column)
4. Share this URL — it works like a hosted mini-app
```

### Call via REST API

```
1. Open any workflow → click "API" tab
2. Copy the auto-generated Python snippet
3. Paste into your own app and call with your inputs
```

---

## 🔧 Project Structure

```
nextflow/
│
├── app/                                # Next.js App Router
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/     # Clerk sign-in page
│   │   └── sign-up/[[...sign-up]]/     # Clerk sign-up page
│   │
│   ├── (protected)/
│   │   ├── dashboard/page.tsx          # Flow dashboard (Magica clone)
│   │   └── workflow/[id]/page.tsx      # Workflow editor
│   │
│   ├── api/
│   │   ├── workflows/route.ts          # CRUD for workflows
│   │   ├── execute/route.ts            # Execution engine
│   │   ├── seed-sample/route.ts        # Sample workflow seeder
│   │   └── webhooks/route.ts           # Trigger.dev callbacks
│   │
│   ├── globals.css                     # Global styles + font vars
│   └── layout.tsx                      # Root layout with Clerk provider
│
├── components/
│   ├── LoadingScreen.tsx               # Animated orbital loading screen
│   └── workflow/
│       ├── WorkflowCanvas.tsx          # Main React Flow canvas (3 tabs)
│       ├── NodePicker.tsx              # Left sidebar node library
│       ├── HistoryPanel.tsx            # Right sidebar run history
│       ├── NodeContextMenu.tsx         # Right-click node context menu
│       ├── edges/                      # Custom animated edge types
│       └── nodes/
│           ├── GeminiNode.tsx          # Google Gemini AI node
│           ├── RequestInputsNode.tsx   # User input collection node
│           ├── ResponseNode.tsx        # Formatted output node
│           └── CropImageNode.tsx       # Image crop node
│
├── trigger/
│   └── gemini-task.ts                  # Trigger.dev AI execution task
│
├── lib/
│   └── prisma.ts                       # Prisma DB client singleton
│
├── store/                              # Zustand state stores
│
├── prisma/
│   └── schema.prisma                   # DB schema (Workflow + WorkflowRun)
│
├── public/
│   └── images/                         # Static assets
│
├── middleware.ts                        # Clerk route protection
├── trigger.config.ts                   # Trigger.dev config
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ Database Schema

```prisma
model Workflow {
  id        String        @id @default(cuid())
  name      String
  userId    String
  nodes     Json          @default("[]")    // ReactFlow nodes array
  edges     Json          @default("[]")    // ReactFlow edges array
  viewport  Json?                           // Canvas pan/zoom state
  status    String        @default("idle")  // idle | running | success | failed
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  runs      WorkflowRun[]

  @@index([userId])
}

model WorkflowRun {
  id          String   @id @default(cuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  userId      String
  status      String   // success | failed | partial
  scope       String   // full | partial | single
  duration    Int      // execution time in milliseconds
  nodeResults Json     @default("[]")   // per-node output + status
  createdAt   DateTime @default(now())

  @@index([workflowId])
  @@index([userId])
}
```

---

## 🚀 Deployment

### 1 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: NextFlow — AI Workflow Builder"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nextflow.git
git push -u origin main
```

---

### 2 — Deploy to Vercel

```bash
# Option A: Vercel CLI
npm i -g vercel
vercel --prod

# Option B: Import via dashboard
# → vercel.com/new → Import Git Repository → select nextflow
```

Add every key from your `.env` to **Vercel → Project → Settings → Environment Variables**.

---

### 3 — Production Database

```bash
# Push schema to your production Postgres (Neon, Supabase, Railway, etc.)
DATABASE_URL="your_prod_db_url" npx prisma db push
```

---

### 4 — Deploy Trigger.dev Tasks

```bash
# In your project directory (with TRIGGER_SECRET_KEY set)
npx trigger.dev@latest deploy
```

---

### 5 — Environment Variables Reference

| Variable | Where to Get It |
|---|---|
| `DATABASE_URL` | Neon → Dashboard → Connection String |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [clerk.com](https://clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | [clerk.com](https://clerk.com) → API Keys |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `TRIGGER_SECRET_KEY` | [trigger.dev](https://trigger.dev) → Project → API Keys |

---

## ✅ Full Requirements Checklist

### Dashboard & Sidebar
- [x] Pixel-perfect Magica.com design
- [x] Off-white sidebar `#f8f8f7` + white main content `#fff`
- [x] Google Sans Flex variable font
- [x] Sidebar width: 240px expanded / 42px collapsed
- [x] `PanelLeft` toggle icon + "Close sidebar ←" pill tooltip
- [x] Nav items: Tasks · Projects · Library · **Flow (active)** · Nodes · API/MCP
- [x] Settings oval outline pill button
- [x] Claim Offer purple gradient oval pill button
- [x] Collapsible bottom panel (chevron toggle)
- [x] User avatar + name, centered horizontally

### Workflow Canvas
- [x] React Flow dot-grid canvas with pan/zoom
- [x] Animated directional edges
- [x] MiniMap (dark, bottom-right)
- [x] Pulsating glow on executing nodes
- [x] Status indicators: running / success / failed / partial
- [x] Right-click context menu on nodes
- [x] Canvas controls: zoom in/out, fit view

### Editor Tabs
- [x] **Workflow tab** — full node canvas
- [x] **Playground tab** — input form + live output column
- [x] **API tab** — Python code snippet + endpoint docs

### Node Types
- [x] Request Inputs (multi-field user input)
- [x] Gemini AI (Pro + Flash, system prompt, vision)
- [x] Crop Image (percentage-based)
- [x] Response (formatted output card)

### Execution
- [x] Trigger.dev background task execution
- [x] DAG validation + topological sort
- [x] Real-time status polling
- [x] Per-node results in `WorkflowRun`
- [x] Execution history panel

### Auth & Data
- [x] Clerk sign-in / sign-up with Google OAuth
- [x] Protected routes (Next.js middleware)
- [x] User-scoped workflows
- [x] PostgreSQL + Prisma persistence
- [x] Import / Export JSON

### API
- [x] Full REST CRUD on workflows
- [x] Zod validation on all routes
- [x] Trigger.dev webhook handler
- [x] Sample workflow seeder (`/api/seed-sample`)

---

## 🎨 Design Tokens

```
Sidebar background ......... #f8f8f7  (off-white)
Main content background .... #ffffff  (pure white)
Canvas background .......... #141820  (dark navy)
Border ..................... #ebebeb
Primary accent ............. #6366f1  (indigo)
Claim Offer gradient ....... #6366f1 → #8b5cf6 → #7c3aed
Nav active pill ............ #ededed
Text primary ............... #111111
Text muted ................. #888888
Font ....................... Google Sans Flex Variable
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# 1. Fork the repo and clone
git clone https://github.com/your-username/nextflow.git

# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Make changes, then commit
git commit -m "feat: describe your change"

# 4. Push and open a Pull Request
git push origin feat/your-feature-name
```

Please follow conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

| Resource | Usage |
|---|---|
| [Magica.com](https://magica.com) | Design inspiration |
| [Google AI Studio](https://aistudio.google.com) | Gemini API |
| [Clerk](https://clerk.com) | Authentication |
| [Trigger.dev](https://trigger.dev) | Background task execution |
| [React Flow](https://reactflow.dev) | Visual canvas engine |
| [Neon](https://neon.tech) | Serverless PostgreSQL |
| [Vercel](https://vercel.com) | Deployment platform |

---

<div align="center">

**Built with ❤️ using Next.js 15, React Flow & Google Gemini**

⭐ **Star this repo** if NextFlow saved you time!

[Report Bug](issues) · [Request Feature](issues) · [Discussions](discussions)

</div>
