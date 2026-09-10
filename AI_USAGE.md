# Engineering Decisions & AI Assistance Log (AI_USAGE.md)

This document transparently records 4 critical architecture and product decisions made during the design and implementation of the LLD Practice Platform, highlighting how AI was utilized as a pair-engineering tool, what recommendations were adopted or rejected, and the underlying engineering rationale.

---

### Decision 1: Evaluation Architecture — Single LLM Scoring vs. Two-Tier Verification

* **Problem / Context**:
  Designing the evaluation pipeline for learner LLD submissions. The challenge was ensuring fast, low-cost feedback without sacrificing grading rigor.
* **What AI Suggested**:
  Send the raw learner submission directly to an unconstrained LLM prompt asking: *"Score this design from 0 to 100 across SOLID principles and return any syntax/logic mistakes."*
* **What Was Accepted**:
  The concept of evaluating object-oriented design against established architectural rubrics (Coupling, Cohesion, Encapsulation, Single Responsibility).
* **What Was Rejected**:
  Using an LLM for initial syntax/completeness checks, and allowing the LLM to assign unanchored scores without deterministic guardrails.
* **Why**:
  1. Relying on an LLM to check whether required fields (e.g. classes, responsibilities, trade-off explanation) exist is slow, nondeterministic, and wastes API tokens.
  2. Without a deterministic validation gate, malformed or empty submissions yield hallucinated evaluations or crashes.
  3. Unanchored LLM prompts result in high score variance (the same submission could receive a 60 or an 85 depending on model temperature).
* **Final Engineering Decision**:
  Implemented a **Two-Tier Architecture**:
  1. **Deterministic Validator (`DeterministicValidator.ts`)**: Runs synchronously in <1ms to check structural invariants (mandatory entity names, minimum responsibility length, valid relationships, presence of trade-off rationale). Returns HTTP 422 with structured blocking errors if invalid.
  2. **Rubric-Bound Evaluator (`IEvaluator`)**: Invoked only after deterministic checks pass. Evaluates 8 fixed criteria with strict JSON schema outputs, requiring concrete evidence from the submission.

---

### Decision 2: Submission Format — Free-Form Code vs. Structured Domain Evidence

* **Problem / Context**:
  Determining how learners should submit their LLD solutions in a rapid 30–45 minute practice session.
* **What AI Suggested**:
  Provide an in-browser code editor (Monaco editor) where learners write complete, compilable Java or TypeScript code with unit tests, executed via a Docker container sandbox.
* **What Was Accepted**:
  The need to evaluate concrete class declarations, method signatures, and attribute definitions.
* **What Was Rejected**:
  Requiring a full compilable codebase and code execution sandbox for this MVP.
* **Why**:
  1. Writing 500–800 lines of boilerplate OOP code (getters, setters, constructors, imports) consumes 80% of a candidate's practice time on typing rather than architectural thinking.
  2. Sandboxed code execution in an interview setting frequently fails on trivial compiler mismatches or missing import statements rather than design flaws.
  3. A full sandbox adds massive operational complexity (Docker, security sandboxing, container escape protection) that detracts from the core LLD practice loop.
* **Final Engineering Decision**:
  Built a **Structured Architectural Evidence Model**:
  Learners provide high-signal design evidence through guided sections: Core Classes & Responsibilities, Interfaces & Contracts, Structural Relationships (Composition/Aggregation/Inheritance), Execution Workflows, Design Patterns, and Trade-off Explanations.
  To satisfy future extensibility (**Change Test A**), the submission domain is abstracted behind `ISubmission<T>` with `format: SubmissionFormat`, allowing code or UML diagrams to be added without modifying the core practice flow.

---

### Decision 3: Persistence Layer — SQLite / Prisma vs. Pure TypeScript Atomic File-Based Storage

* **Problem / Context**:
  Choosing the database and persistence engine for the MVP. The assignment requires persisting problems, attempts, submissions, and evaluations across server restarts, while ensuring friction-free execution on any developer machine without native build toolchain dependencies.
* **What AI Suggested**:
  Set up Prisma ORM with SQLite using `better-sqlite3`.
* **What Was Accepted**:
  A repository pattern (`IProblemRepository`, `IAttemptRepository`, `IEvaluationRepository`) to isolate persistence from domain services.
* **What Was Rejected**:
  Using `better-sqlite3` or external binary SQLite drivers.
* **Why**:
  In modern Windows / Node v24 environments, native C++ bindings (like `better-sqlite3`) frequently encounter node-gyp compilation failures, Python version mismatches, or missing Visual Studio C++ build tools. An interview assessment project must be cloneable and immediately runnable via `npm install` with zero platform-specific toolchain hurdles.
* **Final Engineering Decision**:
  Implemented an **ACID-Safe Atomic File-Based Repository Engine (`FileBasedStorage.ts`)**:
  * Employs write-to-temp-and-rename semantics (`fs.writeFile` to `.tmp` followed by atomic `fs.rename`) to eliminate file corruption.
  * In-memory cache for sub-millisecond lookups.
  * Chained promise write-locks to prevent concurrent race conditions.
  * Preserves clean repository interfaces, allowing seamless replacement with PostgreSQL / Prisma if production scale requires it.

---

### Decision 4: Iterative Learning UX — In-Place Draft Updates vs. Attempt Version Tree

* **Problem / Context**:
  Modeling how a learner retries a problem after receiving feedback.
* **What AI Suggested**:
  Allow learners to edit the existing attempt directly in place and "re-score" it to see the updated evaluation.
* **What Was Accepted**:
  Cloning the previous attempt's content into the new workspace so the learner doesn't have to retype their entire architecture from scratch.
* **What Was Rejected**:
  Overwriting the previous attempt or mutating existing completed evaluations.
* **Why**:
  Overwriting the previous attempt destroys learning history. A core requirement of effective deliberate practice is comparing Attempt $N$ with Attempt $N-1$ to observe what improved (+15 points), what regressed, and what recurring architectural habits persist.
* **Final Engineering Decision**:
  Implemented a **Strict Append-Only Attempt Lifecycle**:
  * An attempt is an immutable record once `COMPLETED`.
  * "Retry Problem" triggers `AttemptService.retryAttempt()`, which allocates a new `Attempt` entity with an incremented `attemptNumber`, copying forward previous submission content as a starting draft.
  * Introduced `AttemptComparator.compare()`, which maps criterion-level score deltas, flags improved vs regressed criteria, and alerts the user to recurring weaknesses scoring < 70 across consecutive attempts.
