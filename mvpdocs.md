# Interview Buddy MVP Plan

## Product Goal
Build a production-structured MVP of Interview Buddy that lets users run mock interviews end-to-end:
- Pick interview type (Technical or HR)
- Verify camera/microphone and preview device feed
- Record answers question-by-question in-browser
- View a deterministic post-interview analysis report

The MVP prioritizes a complete user workflow and clean engineering foundations over real AI scoring or backend persistence.

## MVP Scope (Phase 1)
- Frontend-only implementation using React + TypeScript + Vite
- Route flow: `/` -> `/setup` -> `/interview` -> `/results`
- Interview type selection (`technical`, `hr`)
- Camera/microphone permission gating with preview stream
- In-browser recording per question via `MediaRecorder`
- Question timer and progress tracking
- Interview controls: start, pause, resume, stop, next, finish, end early
- Deterministic rule-based scoring and feedback generation
- Results dashboard with:
  - Overall score and grade
  - Category breakdown (Speech, Content, Body Language)
  - Per-question score cards
  - Strengths and improvement suggestions
- Core test coverage (unit + component + integration)

## Out of Scope (Phase 1)
- Supabase Auth login/signup
- Supabase interview persistence/history
- Real AI/LLM analysis pipeline
- ElevenLabs question narration
- Sharing/exporting reports
- User-defined custom question uploads

## User Flow and Route Map
1. `GET /`
   - Landing page with CTA "Start Interview"
2. `GET /setup`
   - Select interview type
   - Request camera/mic permissions
   - Show live preview and readiness state
   - Start interview button enabled only when requirements are met
3. `GET /interview`
   - Load 5 questions based on interview type
   - Display one question at a time
   - Start/pause/resume/stop recording for current question
   - Countdown timer per question
   - Move to next question or finish
4. `GET /results`
   - Build report from in-memory/session payload
   - Show score summaries and actionable insights
   - Support fallback state when route is accessed directly

## Functional Requirements
### FR-1 Interview Type Selection
- User can select exactly one interview type before starting.
- Allowed values: `technical` and `hr`.

### FR-2 Permission and Preview
- App must request camera and microphone permissions on Setup.
- If granted, render local video preview.
- If denied, show actionable error with retry.

### FR-3 Interview Question Session
- Each interview consists of exactly 5 questions.
- One active question at a time.
- Timer starts when question session starts.
- Timer expiration auto-stops current recording and allows progression.

### FR-4 Recording Controls
- Recording states: `idle -> recording -> paused -> recording -> stopped`.
- Each question can have one final recorded response.
- Store response blob and timing metadata for scoring.

### FR-5 Navigation and Completion
- Next question available after stop or timer expiry.
- Finish on last question routes to `/results`.
- End interview early routes to `/results` with partial completion.

### FR-6 Results and Scoring
- Generate deterministic report from session metadata.
- Provide overall score, category scores, per-question scores, grade, strengths, and improvements.

## Non-Functional Requirements
- Responsive on desktop and mobile viewport widths.
- Permissions and recording errors must fail gracefully.
- No uncaught runtime errors on unsupported media capabilities.
- Core user flow should function on latest Chrome and Firefox.
- Strict TypeScript mode with explicit interfaces for session/report data.

## Tech Stack and Project Setup
- React 18 + TypeScript 5 + Vite 5
- React Router DOM 6
- Tailwind CSS + shadcn/ui
- TanStack React Query only if needed for future fetch patterns (optional in Phase 1)
- Vitest + Testing Library

Initial bootstrap tasks:
1. Scaffold Vite React TypeScript app.
2. Configure Tailwind and base design tokens.
3. Add Router and page shells.
4. Add test harness (`vitest`, `jsdom`, `@testing-library/react`).

## Proposed Folder Structure
```text
interview-buddy/
├── public/
├── src/
│   ├── components/
│   │   ├── landing/
│   │   ├── interview/
│   │   ├── results/
│   │   └── ui/
│   ├── hooks/
│   │   ├── useMediaPermissions.ts
│   │   ├── useMediaRecorder.ts
│   │   └── useInterviewSession.ts
│   ├── lib/
│   │   ├── interview-data.ts
│   │   ├── scoring.ts
│   │   ├── grading.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── Setup.tsx
│   │   ├── Interview.tsx
│   │   ├── Results.tsx
│   │   └── NotFound.tsx
│   ├── types/
│   │   ├── interview.ts
│   │   └── report.ts
│   ├── test/
│   │   ├── setup.ts
│   │   └── fixtures/
│   ├── App.tsx
│   └── main.tsx
├── README.md
└── mvpdocs.md
```

## Data Models and Types
```ts
export type InterviewType = "technical" | "hr";

export interface InterviewQuestion {
  id: string;
  type: InterviewType;
  category: string;
  prompt: string;
  timeLimitSec: number;
}

export interface RecordedResponse {
  questionId: string;
  blob: Blob;
  durationSec: number;
  startedAt: string;
  endedAt: string;
}

export interface InterviewSessionState {
  interviewType: InterviewType;
  questions: InterviewQuestion[];
  currentIndex: number;
  responses: RecordedResponse[];
  isRecording: boolean;
  timeLeftSec: number;
}
```

```ts
export interface QuestionScore {
  questionId: string;
  speechScore: number;
  contentScore: number;
  bodyLanguageScore: number;
  overall: number;
}

export interface InterviewReport {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categoryBreakdown: {
    speech: number;
    content: number;
    bodyLanguage: number;
  };
  questionScores: QuestionScore[];
  strengths: string[];
  improvements: string[];
}
```

## Public Interfaces / Contracts
### Routes
- `/` landing entry point
- `/setup` interview preparation and permission checks
- `/interview` active interview session
- `/results` report output

### Route State Contract (`/interview` -> `/results`)
`/results` expects serialized session summary:
```ts
interface ResultsRouteState {
  interviewType: InterviewType;
  totalQuestions: number;
  answeredQuestions: number;
  responsesMeta: Array<{
    questionId: string;
    durationSec: number;
    startedAt: string;
    endedAt: string;
  }>;
}
```

Fallback behavior:
- If route state is missing (refresh/deep-link), show empty-state CTA back to `/setup`.

### Question Bank Contract (`lib/interview-data.ts`)
```ts
type InterviewBank = Record<InterviewType, InterviewQuestion[]>;
```
- Exactly 5 active questions returned for each interview type in MVP.

## State Management Strategy
- Local component state for transient UI controls (modals, toggles).
- Dedicated session hook (`useInterviewSession`) to manage:
  - active question index
  - timer
  - response metadata
  - recording lifecycle integration
- Pass session summary to results route via `navigate("/results", { state })`.
- No global store required in Phase 1.

## Scoring and Results Logic (Rule-Based)
Scoring inputs:
- Answer completion ratio (`answeredQuestions / totalQuestions`)
- Duration quality per response (within expected answer window)
- Stability signal (few pause/resume interruptions)

Deterministic formula (MVP baseline):
1. Base score: 60
2. Completion contribution: up to +20
3. Duration quality contribution: up to +10
4. Recording stability contribution: up to +10
5. Clamp final score to `[0, 100]`

Category mapping:
- Speech: weighted by duration consistency and pause frequency
- Content: weighted by completion ratio and answer coverage
- Body Language: mocked baseline with slight variance by consistency

Grade thresholds:
- `A`: 90-100
- `B`: 80-89
- `C`: 70-79
- `D`: 60-69
- `F`: 0-59

Feedback generation:
- Strengths selected when category score >= 80
- Improvements selected when category score < 75
- Use predefined phrase bank for deterministic output

## Error Handling and Edge Cases
- Permission denied:
  - Show clear retry action
  - Explain browser settings path
- `MediaRecorder` unsupported:
  - Disable recording workflow
  - Show non-blocking unsupported-browser message
- Stream interruption during recording:
  - Stop active recording safely
  - Mark question as interrupted and allow retry
- Timer reaches zero mid-record:
  - Auto-stop and save recorded chunk
- Early interview termination:
  - Generate partial report with answered subset
- Direct access to `/interview` without setup state:
  - Redirect to `/setup`

## Testing Strategy
### Unit Tests
- `scoring.ts`
  - deterministic score generation for fixed inputs
  - clamp boundaries
- `grading.ts`
  - grade mapping for threshold boundaries
- timer/session reducer logic
  - start, tick, pause, resume, stop transitions

### Component Tests
- Setup page:
  - permission granted and denied states
  - start button gating
- Interview page:
  - question progression
  - record/pause/resume UI state
  - timer countdown display
- Results page:
  - renders overall and category scores
  - fallback empty state with missing route data

### Integration Tests
- Happy path:
  - `/` -> `/setup` -> `/interview` -> `/results`
- Early end path:
  - stop after N<5 questions and validate partial report
- Error path:
  - permission denied then recover and continue

### Manual QA Matrix
- Chrome latest on desktop
- Firefox latest on desktop
- Mobile viewport responsiveness
- Camera/mic permission revoke + retry behavior

## Milestones and Delivery Plan
1. Foundation (Day 1)
   - Project scaffold, routing, styling baseline, type definitions
2. Setup Flow (Day 2)
   - Interview type selection, permissions, preview
3. Interview Engine (Day 3-4)
   - Question rendering, timer, recording lifecycle, navigation
4. Results Engine (Day 5)
   - Rule-based scoring + dashboard rendering
5. Quality Pass (Day 6)
   - Tests, edge-case handling, copy and UX polish

## Risks and Mitigations
- Browser media API inconsistencies
  - Mitigation: feature detection + guarded code paths + clear fallback UI
- Blob memory growth during recordings
  - Mitigation: store only final per-question blob; release stream/tracks promptly
- State loss on refresh
  - Mitigation: explicit fallback UX on results/interview pages (Phase 1), sessionStorage enhancement optional in Phase 1.1

## Phase 2+ Roadmap
- Supabase Auth integration and route protection
- Persist interview sessions and reports per user
- Historical progress dashboard
- AI-backed scoring API integration
- Question narration (ElevenLabs)
- Shareable report links and export options

## Acceptance Criteria
- User can complete a full 5-question interview in browser without backend.
- App records and transitions through all questions with timer behavior.
- Results page always renders either:
  - valid report from session state, or
  - safe fallback empty state
- Deterministic scoring returns stable output for same inputs.
- Core automated tests pass (`unit`, `component`, `integration` subsets).

## Assumptions
- Phase 1 is frontend-first MVP with no persistence.
- Rule-based analysis is acceptable temporary behavior.
- Auth and history tracking move to Phase 2.
- Browser support target is modern Chromium and Firefox.
