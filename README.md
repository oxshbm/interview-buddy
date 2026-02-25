# Interview Buddy 🎯

> An AI-powered mock interview practice platform that helps you prepare for technical and HR interviews with real-time video recording and smart performance analysis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [App Flow](#app-flow)
- [API & Integrations](#api--integrations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Interview Buddy** is a full-stack web application designed to help job seekers practice and improve their interview skills. Users can choose between **Technical** or **HR/Behavioral** interview modes, answer AI-generated questions on camera, and receive a detailed performance analysis report covering speech delivery, content quality, and body language.

The platform records video responses directly in the browser using the native `MediaRecorder` API — no third-party recording service needed. Post-interview, a smart analysis dashboard breaks down your performance across multiple dimensions with actionable improvement suggestions.

---

## Features

- **Dual Interview Modes**
  - Technical Interview (~15 min, 5 questions): system design, problem solving, code quality, development practices
  - General HR Interview (~12 min, 5 questions): behavioral, teamwork, self-assessment, career goals

- **Camera & Microphone Setup**
  - Live preview with permission-gating before the session starts
  - Camera and microphone toggle controls during the interview

- **Live Interview Session**
  - One question displayed at a time with category label
  - Per-question countdown timer (90–180 seconds)
  - Progress indicator (Question X of 5)
  - Start / Pause / Resume video recording per question
  - Early exit with "End Interview" button

- **Smart Analysis Dashboard**
  - Overall score with grade (A–F scale)
  - Category breakdown: Speech & Delivery, Content Quality, Body Language
  - 4-tab detailed view: Overview, Speech, Content, Body Language
  - Question-by-question score breakdown
  - Strengths and Areas to Improve lists
  - Sub-metric progress bars (speaking pace, filler words, clarity, eye contact, posture, etc.)

- **Modern UI/UX**
  - Responsive design with Tailwind CSS
  - Dark/light mode support via `next-themes`
  - Full shadcn/ui component library (Radix UI primitives)
  - Smooth animations with `tailwindcss-animate`

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 18.3 |
| Language | TypeScript | 5.8 |
| Build Tool | Vite + SWC | 5.4 |
| Routing | React Router DOM | 6.30 |
| Server State | TanStack React Query | 5.83 |
| UI Components | shadcn/ui (Radix UI) | latest |
| Styling | Tailwind CSS | 3.4 |
| Icons | Lucide React | 0.462 |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Charts | Recharts | 2.15 |
| Backend / DB | Supabase (PostgreSQL + Auth) | 2.95 |
| Notifications | Sonner | 1.7 |
| Theme | next-themes | 0.3 |
| Video Capture | Browser MediaRecorder API | - |
| Testing | Vitest + Testing Library | 3.x |
| Platform | Lovable Cloud | - |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **bun**
- A [Supabase](https://supabase.com) project (free tier works)
- A modern browser with camera/microphone access (Chrome, Firefox, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/interview-buddy.git
cd interview-buddy

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

You can find these values in your Supabase project dashboard under **Settings → API**.

---

## Usage

1. **Open the app** at `http://localhost:8080`
2. **Click "Start Interview"** on the landing page
3. **Choose interview type** (Technical or General HR) on the Setup page
4. **Grant camera and microphone permissions** — a live preview confirms your setup
5. **Click "Start Interview"** to begin the session
6. **Answer each question** on camera — use the record button to capture your response
7. **Navigate through questions** with Next/Finish controls
8. **Review your results** on the analysis dashboard

---

## Project Structure

```
interview-buddy/
├── public/                    # Static assets (favicon, robots.txt)
├── src/
│   ├── components/
│   │   ├── landing/           # Landing page sections (Hero, HowItWorks)
│   │   ├── ui/                # shadcn/ui component library (48 components)
│   │   └── NavLink.tsx        # Navigation link component
│   ├── hooks/
│   │   ├── use-mobile.tsx     # Responsive breakpoint hook
│   │   └── use-toast.ts       # Toast notification hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts      # Supabase client initialization
│   │       └── types.ts       # Auto-generated DB types
│   ├── lib/
│   │   ├── interview-data.ts  # Question bank, interview configs, types
│   │   └── utils.ts           # Tailwind cn() utility
│   ├── pages/
│   │   ├── Index.tsx          # Landing page
│   │   ├── Setup.tsx          # Interview type selection + camera check
│   │   ├── Interview.tsx      # Live interview session with recording
│   │   ├── Results.tsx        # Post-interview analysis dashboard
│   │   └── NotFound.tsx       # 404 page
│   ├── test/                  # Vitest test setup
│   ├── App.tsx                # Root component + router configuration
│   ├── main.tsx               # React DOM entry point
│   └── index.css              # Global styles + CSS design tokens
├── supabase/
│   └── config.toml            # Supabase local dev config
├── index.html                 # HTML entry point
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## App Flow

```
Landing Page (/)
    │
    ▼
Setup Page (/setup)
  • Choose interview type: Technical | General HR
  • Grant camera + microphone permissions
  • Live camera preview
    │
    ▼
Interview Session (/interview)
  • Questions displayed one at a time
  • Per-question countdown timer
  • MediaRecorder captures video/audio as WebM
  • Navigate through 5 questions
    │
    ▼
Results Dashboard (/results)
  • Overall score + grade
  • Speech / Content / Body Language breakdown
  • Question-by-question analysis
  • Strengths + improvement areas
```

---

## API & Integrations

### Supabase
- **Client:** `src/integrations/supabase/client.ts`
- Initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Planned features: user authentication, interview history persistence

### Browser MediaRecorder API
- Used in `src/pages/Interview.tsx`
- Records `video/webm; codecs=vp9` format
- Stores `RecordedResponse` blobs in memory, passed to Results via router state

### ElevenLabs (Planned)
- AI voice for reading interview questions aloud
- Not yet implemented

---

## Roadmap

- [x] Landing page with feature overview
- [x] Interview type selection + camera/mic setup
- [x] Live interview session with per-question video recording
- [x] Post-interview analysis dashboard (mock data)
- [ ] Real AI analysis of recorded responses
- [ ] ElevenLabs voice integration for question narration
- [ ] User authentication with Supabase Auth
- [ ] Interview history and progress tracking
- [ ] Shareable results reports
- [ ] Custom question sets / upload your own questions
- [ ] Mobile-responsive recording experience

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure your code passes linting (`npm run lint`) and tests (`npm test`) before submitting.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with ❤️ using React, Vite, and Supabase</p>
