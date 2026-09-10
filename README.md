# LLDCraft — Low-Level Design Practice & Evaluation Platform

An engineering platform designed for deliberate practice in Low-Level Design (LLD), object-oriented domain modeling, and machine coding interviews.

> **Core Philosophy**: *"Practice LLD. Validate structural invariants deterministically. Receive explainable, rubric-based feedback. Improve your next design."*

---

## 1. Project Overview

Preparing for Low-Level Design interviews (SDE-2 / Senior SDE / Staff) is difficult because design has no single "correct" answer. Traditional video tutorials offer passive consumption, while unconstrained LLM prompts produce inconsistent, hallucinated scores without actionable feedback.

**LLDCraft** solves this by offering an end-to-end, iterative practice loop:
1. **Explore Problems**: Choose from 5 industry-standard LLD scenarios with concrete requirements, business rules, and constraints.
2. **Design Architecture**: Use a guided workspace to model Core Entities, Responsibilities, Interfaces, Structural Relationships, Execution Workflows, Design Patterns, and Trade-offs.
3. **Deterministic Validation**: Verify structural invariants (non-empty classes, single responsibility definitions, explanation depth, state guards) in $<1\text{ms}$ before invoking evaluators.
4. **Explainable Rubric Feedback**: Receive comprehensive assessments across 8 dimensions evaluated with concrete submitted evidence, identified concerns, actionable suggestions, and confidence scores.
5. **Iterate & Improve**: Start a new attempt prefilled with your prior design, compare score deltas (Attempt $N$ vs $N-1$), identify resolved issues, and target recurring weaknesses.

---

## 2. Key Features

* **5 Curated Seed Problems**:
  * **Parking Lot System** (Multi-level, spot allocation strategies, ticketing, dynamic fees, gates)
  * **Vending Machine System** (State pattern, cash validation, change-making algorithm, inventory)
  * **Elevator System** (Multi-car controller, SCAN/LOOK dispatching, hall/car calls, capacity)
  * **Library Management System** (Book vs BookItem cataloging, quotas, waitlists, overdue fines)
  * **Splitwise / Expense Sharing** (Multi-user groups, equal/exact/percent splits, debt simplification)
* **Structured Architectural Evidence Submission**:
  * Scoping & Assumptions
  * Core Classes & Single Responsibilities (attributes & methods)
  * Interfaces & Abstraction Rationale (Dependency Inversion)
  * Relationships (Composition, Aggregation, Association, Inheritance, Dependency)
  * Sequential System Workflows
  * Justified Design Pattern Application
  * Extensibility Rationale (Open-Closed Principle)
  * Concurrency & Edge Cases
  * Overall Trade-off Rationale
* **Two-Tier Verification Engine**:
  * **Deterministic Validation**: Enforces mandatory fields, entity naming, responsibilities, and structural integrity before calling external evaluators.
  * **Pluggable Evaluators**: Dual-mode engine supporting Google Gemini AI (`gemini-2.5-flash`) with strict JSON schema outputs and a high-fidelity offline `MockEvaluator` for instant, deterministic demos.
* **8-Dimension LLD Rubric**:
  1. *Requirement Understanding*
  2. *Class Responsibilities (SRP)*
  3. *Coupling & Cohesion*
  4. *Encapsulation & Interfaces*
  5. *Abstraction / Design Patterns*
  6. *Extensibility (OCP)*
  7. *Edge Cases & Testability*
  8. *Explanation & Trade-offs*
* **Attempt State Machine & Comparison Engine**:
  * Strict lifecycle: `DRAFT` → `SUBMITTED` → `EVALUATING` → `COMPLETED` / `FAILED`
  * Comparative progress tracking: Score delta, improved criteria, regressed criteria, and recurring weakness alerts ($<70$ on consecutive attempts).
  * Non-destructive retry: New attempts are created without overwriting historical evaluations.
* **Developer-Focused UI**:
  * Minimalist, high-density dark theme built with Tailwind CSS and Lucide icons.
  * Live draft saving, pre-submission checklists, and responsive layouts.

---

## 3. Tech Stack & Architecture

* **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React
* **Backend**: Next.js Route Handlers (`/api/problems`, `/api/attempts`, `/api/attempts/[id]/submit`, `/api/attempts/[id]/evaluate`, `/api/attempts/[id]/retry`)
* **Domain Layer**: Clean Architecture (Pure TypeScript models, State Machines, Comparators)
* **Persistence**: ACID-safe atomic file-backed storage (`FileBasedStorage.ts` with write-to-temp-and-rename and write-chain locks)
* **Testing**: Vitest (21 unit and integration tests covering state transitions, validation, evaluators, and the full practice loop)

---

## 4. Getting Started & Setup

### Prerequisites
* Node.js v18+ (tested on Node v24.19.0)
* npm v9+

### Installation
```bash
# 1. Clone or navigate to the repository
cd lld-practice-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables (defaults to offline mock demo mode)
cp .env.example .env.local
```

---

## 5. Environment Variables

Create a `.env.local` file in the project root:

```env
# Evaluator Mode: 'mock' (default, offline deterministic demo) or 'gemini' (uses Google Gemini API)
EVALUATOR_MODE=mock

# Google Gemini API Key (required if EVALUATOR_MODE=gemini)
# Get a key at: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port
PORT=3000
```

> **Demo Mode Guarantee**: If `EVALUATOR_MODE=mock` or if `GEMINI_API_KEY` is omitted, the platform automatically utilizes `MockEvaluator`. It analyzes the candidate's actual submitted classes, interfaces, and methods to produce realistic, evidence-based feedback without requiring an external API key.

---

## 6. Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

### Running Automated Tests
```bash
npm test
```

---

## 7. 5–10 Minute Demo Sequence for Interviewers

1. **Dashboard (`/`)**:
   * Inspect high-level metrics: Problems Practiced, Completed Attempts, Average Score, and Priority Focus Areas.
2. **Problem Library (`/problems`)**:
   * Filter by difficulty (Beginner, Intermediate, Advanced) and status.
   * Select **Parking Lot System**.
3. **Problem Detail (`/problems/parking-lot`)**:
   * Review scenario, functional requirements, business rules, constraints, and hints.
   * Click **Start Practice** to initialize Attempt #1.
4. **Practice Workspace (`/attempts/[id]`)**:
   * Enter domain classes (`ParkingLot`, `ParkingSpot`, `Vehicle`, `Ticket`).
   * Add an abstraction (`IParkingAllocationStrategy`) and state its rationale.
   * Detail relationships (Composition between `ParkingLot` and `ParkingSpot`).
   * Try submitting an incomplete design to observe **Deterministic Validation** catching missing fields without wasting LLM calls.
   * Complete the design and click **Submit Design**.
5. **Evaluation & Feedback (`/attempts/[id]/feedback`)**:
   * Watch the asynchronous evaluation state transition to `COMPLETED`.
   * Review the **Overall Score**, **Summary**, and **Next Practice Focus** banner.
   * Expand the **8 Rubric Breakdown cards** to see concrete evidence quotes and actionable recommendations.
6. **Retry Workflow (`/attempts/[id]/feedback` -> Retry)**:
   * Click **Retry with Improvements**. Notice a fresh Attempt #2 is spawned with previous content pre-filled for iteration.
   * Refactor a weakness (e.g. introduce a `PaymentService` to decouple fee calculation).
   * Submit and review the **Comparative Analysis** showing score deltas, improved criteria, and recurring weakness checks.
7. **Attempt History (`/attempts`)**:
   * View the progress trajectory across attempts.

---

## 8. Known Limitations & Future Improvements

* **Known Limitations**:
  * Currently supports structured text submissions; direct UML diagram drag-and-drop is planned for Phase 2.
  * Persistence uses atomic JSON files in `.data/` suited for local evaluation and demos. Production high-scale deployments would connect PostgreSQL via Prisma.
* **Realistic Next Steps**:
  * Interactive UML diagram generation using Mermaid.js from structured inputs.
  * Real-time multi-peer architecture critiques.
  * Asynchronous queue processing via BullMQ / Redis for high-concurrency evaluation spikes.
