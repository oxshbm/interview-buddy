import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ResultsPage from "./Results";

describe("ResultsPage", () => {
  it("shows fallback when no state is present", () => {
    sessionStorage.clear();
    render(
      <MemoryRouter initialEntries={["/results"]}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/No interview data found/i)).toBeInTheDocument();
  });

  it("renders report for valid route state", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/results",
            state: {
              interviewType: "technical",
              totalQuestions: 5,
              answeredQuestions: 4,
              recording: {
                mimeType: "video/webm",
                durationSec: 420,
                startedAt: "x",
                endedAt: "y",
                pauseCount: 1
              },
              timeline: [
                {
                  questionId: "t1",
                  questionText: "Q1",
                  narrationStartMs: 0,
                  narrationEndMs: 4000,
                  answerWindowStartMs: 4000,
                  answerWindowEndMs: 94000
                },
                {
                  questionId: "t2",
                  questionText: "Q2",
                  narrationStartMs: 100000,
                  narrationEndMs: 104000,
                  answerWindowStartMs: 104000,
                  answerWindowEndMs: 174000
                }
              ],
              tts: {
                provider: "browser",
                localeRequested: "en-US",
                localeResolved: "en-US",
                available: true,
                fallbackUsed: false
              }
            }
          }
        ]}
      >
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Overall Score:/i)).toBeInTheDocument();
    expect(screen.getByText(/Question Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Recording Summary/i)).toBeInTheDocument();
  });
});
