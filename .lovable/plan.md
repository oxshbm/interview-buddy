
# AI Mock Interview Platform

A clean, professional mock interview platform that helps users practice technical and HR interviews with AI-powered analysis and feedback.

---

## Core Features (MVP)

### 1. Landing Page & Onboarding
- Hero section explaining the platform's value
- "Start Interview" CTA button
- Brief overview of how it works

### 2. Interview Setup
- Select interview type: Technical or General HR
- View estimated duration and number of questions
- Camera/microphone permission check before starting

### 3. Live Interview Experience
- **AI Voice reads questions** using text-to-speech (ElevenLabs)
- Camera feed displayed so user can see themselves
- Timer countdown for each question (configurable per question type)
- Clear progress indicator (Question 3 of 10)
- "Next Question" and "End Interview" controls

### 4. Recording & Analysis
- Video/audio recording of user's responses
- After interview ends, AI analyzes:
  - **Speech**: Pace, filler words (um, uh, like), clarity
  - **Content**: Relevance, structure, key points covered
  - **Video**: Eye contact, facial expressions, posture (body language)

### 5. Results Dashboard
- Overall score with breakdown by category
- Specific feedback for each question answered
- Strengths and areas for improvement
- Option to re-watch recorded responses

---

## User Accounts & Progress Tracking

### 6. Authentication
- Sign up / Sign in with email
- Google authentication option

### 7. Interview History
- List of all past interview sessions
- Filter by type (Technical/HR) and date
- View detailed analysis from any past session
- Track improvement over time with progress charts

---

## Design Style
- **Minimalist & clean** aesthetic (Notion-inspired)
- Neutral color palette with subtle accents
- Clean typography and generous whitespace
- Smooth, subtle animations for transitions
- Mobile-responsive design

---

## Technical Requirements
- **Lovable Cloud** for backend (database, auth, edge functions)
- **ElevenLabs** for AI voice to read questions
- **Lovable AI** for response analysis
- **Browser MediaRecorder API** for video/audio capture
- User data storage for interview history and progress

---

## Future Enhancements (Post-MVP)
- More interview types (behavioral, industry-specific)
- Interview scheduling and reminders
- Shareable results/reports
- Practice mode with instant feedback
- Leaderboards and achievements

