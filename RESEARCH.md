# Low-Level Design (LLD) Evaluation & Learning Platform — Research & Analysis

## 1. The Learner Problem: Why LLD Practice is Difficult to Evaluate

Low-Level Design (LLD), object-oriented domain modeling, and machine coding interviews form a core evaluation pillar for software engineering roles (SDE-2, Senior SDE, Tech Lead, Staff). While High-Level Design (HLD) centers on distributed systems topologies, caching layers, and database sharding, Low-Level Design measures how effectively an engineer translates ambiguous real-world requirements into maintainable, decoupled, and extensible object-oriented code.

Despite its importance, deliberate practice for LLD is notoriously challenging:

1. **Subjectivity & Plurality of Valid Solutions**: Unlike algorithmic coding (e.g. LeetCode) where test suites provide binary pass/fail feedback based on time and space bounds, Low-Level Design has no single "correct" solution. A solution emphasizing the State pattern may be as valid as one using a Strategy pattern combined with a Command queue, provided the trade-offs align with domain constraints.
2. **The "God Class" Anti-Pattern Trap**: Beginners and intermediate candidates routinely build monolithic classes (e.g. a 1,000-line `ParkingLot` or `ElevatorSystem` class that directly executes billing, modifies hardware flags, orchestrates threads, and prints tickets). Without active review, learners mistake working procedural code for sound object-oriented architecture.
3. **Superficial Feedback in Existing Tools**: Most existing learning solutions rely either on passive video tutorials (where the instructor presents their own static solution) or generic LLM prompts ("Here is my code, rate it out of 10"). Unconstrained LLMs either hallucinate nonexistent requirements, compare the user's design against an arbitrary memorized GitHub repo, or flatter the user with shallow praise ("Great design, looks good!").
4. **Lack of an Iterative Feedback Loop**: In real engineering and competitive interviews, design is iterative. A candidate makes an initial proposal, receives interviewer pushback on concurrency or an evolving requirement, and refines their class hierarchy. Traditional mock interview sites provide one-off sessions without progressive revision tracking.

---

## 2. Existing Approaches & Market Landscape

To inform the architecture of this MVP, we researched existing developer platforms, open-source repositories, and educational offerings:

| Platform / Resource | Approach | Strengths | Limitations & Gaps |
| :--- | :--- | :--- | :--- |
| **LeetCode Machine Coding & LLD Discussions** ([leetcode.com/discuss/interview-question](https://leetcode.com/discuss/interview-question)) | Forum threads and peer post reviews | Real interview questions from top tech firms; varied community solutions | Unstructured; peer reviews are subjective, inconsistent, and often unreviewed |
| **Educative.io: Grokking the Low-Level Design Interview** ([educative.io](https://www.educative.io/courses/grokking-the-low-level-design-interview-using-ood-principles)) | Text tutorials with pre-built UML diagrams and code snippets | Comprehensive problem catalog (Parking Lot, Movie Ticket Booking, Splitwise) | Passive consumption; no interactive submission, validation, or personalized feedback on candidate's own design |
| **DesignGururs.io: Grokking OOD** ([designgurus.org](https://www.designgurus.org)) | Structured walkthroughs of class diagrams and SOLID principles | Strong conceptual focus on Single Responsibility and Design Patterns | Static reading material; lacks machine evaluation or design simulation |
| **Refactoring.Guru** ([refactoring.guru](https://refactoring.guru/design-patterns)) | Visual pattern catalogs and code examples | Exceptional visualization of Gang of Four patterns and trade-offs | Reference material only; no scenario-driven practice or grading engine |
| **GitHub: tssovi/grokking-the-object-oriented-design-interview** ([github.com](https://github.com/tssovi/grokking-the-object-oriented-design-interview)) | Open-source Java/Python reference implementations | High code availability for popular questions | Encourages memorization of a single reference implementation rather than reasoning |

### Key Observations & Insights:
* **The Gap in Interactive Evaluation**: No major developer tool currently bridges the gap between passive reading (tutorials) and expensive 1-on-1 human mock interviews ($150-$250/hour on platforms like Interviewing.io).
* **The Failure of Unstructured Free-Text AI**: Passing an unformatted markdown dump into an LLM produces fluctuating, non-repeatable evaluations. Without a deterministic validation step and a strict rubric schema, scores drift arbitrarily between attempts.
* **Why Code-Only Submissions are Sub-optimal for Fast Iteration**: Writing 800 lines of boilerplate Java or C++ in a 45-minute practice session burdens the learner with language syntax and package configurations rather than focusing on class contracts, responsibilities, and abstractions. A structured architectural evidence model captures 95% of LLD signals in 20% of the time.

---

## 3. Product Direction: The LLDCraft Philosophy

Our research directly shaped the following core design choices:

1. **Evidence-Based Evaluation Over "AI Score Generation"**:
   Rather than treating AI as an oracle that outputs an opaque score, our platform treats AI as a rubric auditor. The AI must extract verbatim quotes and references from the candidate's submission as evidence before leveling a concern or awarding a score.
2. **Two-Tier Verification (Deterministic Validation + AI Reasoning)**:
   Computers excel at deterministic invariant checking (e.g., verifying that class names are not empty, responsibilities are specified, relationships reference declared entities, and overall explanations exist). AI should only be called once deterministic checks succeed, conserving latency and tokens while eliminating trivial parsing errors.
3. **Transparent 8-Dimension Rubric**:
   We formalized the industry-standard LLD rubric into 8 explicit dimensions:
   * *Requirement Understanding*
   * *Class Responsibilities (SRP)*
   * *Coupling & Cohesion*
   * *Encapsulation & Interfaces*
   * *Abstraction / Design Patterns*
   * *Extensibility (OCP)*
   * *Edge Cases & Testability*
   * *Explanation & Trade-offs*
4. **First-Class Retry & Iteration Tracking**:
   Engineering excellence is demonstrated by how one adapts to critique. Our system tracks Attempt $N$ versus Attempt $N-1$, calculating score deltas, recognizing fixed design flaws, and flagging recurring blind spots across attempts.
